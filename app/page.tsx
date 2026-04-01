'use client';

import { useState, useRef, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { UploadZone } from "@/components/upload-zone";
import { ScriptSidebar, ScriptsPayload } from "@/components/script-sidebar";
import { StoryboardDetails } from "@/components/storyboard-details";
import { CaptionOverlay } from "@/components/caption-overlay";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogOut, Film, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [userScript, setUserScript] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(15);
  const [captionPosition, setCaptionPosition] = useState({ x: 0, y: 0 });

  const [currentTime, setCurrentTime] = useState(0);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [activeScriptBlocks, setActiveScriptBlocks] = useState<any[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [scripts, setScripts] = useState<ScriptsPayload | null>(null);
  
  // Track uploaded URL to avoid re-uploads on re-generation
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  // Load saved script from storage
  useEffect(() => {
    const savedScript = localStorage.getItem("video-to-script-custom");
    if (savedScript) setUserScript(savedScript);
  }, []);

  // Sync script to storage natively
  useEffect(() => {
    localStorage.setItem("video-to-script-custom", userScript);
  }, [userScript]);

  const chunkScriptLocal = (text: string, duration: number) => {
    if (!text || text.trim() === '') return [];
    // Match sentences including their punctuation
    const sentences = text.match(/[^.!?]+(?:[.!?]+|$)/g) || [text];
    const totalChars = text.length;
    let currentStartTime = 0;
    
    return sentences.map(sentence => {
       const sentenceStr = sentence.trim();
       if (!sentenceStr) return null;
       const proportion = sentence.length / totalChars; 
       const blockDuration = duration * proportion;
       
       const block = {
         startTime: currentStartTime,
         endTime: currentStartTime + blockDuration,
         text: sentenceStr,
         visualContext: 'Custom manual timing'
       };
       currentStartTime += blockDuration;
       return block;
    }).filter(Boolean);
  };

  const customBlocks = useMemo(() => {
    return chunkScriptLocal(userScript, videoDuration);
  }, [userScript, videoDuration]);

  const handleLocalCustomEdit = (text: string) => {
    setUserScript(text);
    if (activeScriptId === 'custom') {
       setActiveScriptBlocks(chunkScriptLocal(text, videoDuration));
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleSelectScript = (id: string, blocks: any[]) => {
    setActiveScriptId(id);
    setActiveScriptBlocks(blocks);
    
    // Auto-play and reset timeline when pressing Preview
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(URL.createObjectURL(selectedFile));
    setActiveScriptId(null);
    setActiveScriptBlocks([]);
    setScripts(null);
    setUploadedVideoUrl(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const processVideo = async () => {
    if (!file && !uploadedVideoUrl) return;

    try {
      setIsProcessing(true);
      setScripts(null);
      // Wait, we WANT to keep the video in the player, but we just generate new scripts
      // Keep activeScriptId and activeBlock... wait, if generating, sure, keep them for now.

      let targetVideoUrl = uploadedVideoUrl;

      // 1. Authenticate / get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload videos.');
        router.push('/login');
        return;
      }

      if (file && !targetVideoUrl) {
        // 2. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        toast.info('Generating secure upload link...');

        const uploadUrlRes = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath })
        });

        const uploadUrlData = await uploadUrlRes.json();
        if (!uploadUrlRes.ok) {
          throw new Error(uploadUrlData.error || 'Failed to generate secure upload link');
        }

        toast.info('Uploading video to storage...');

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .uploadToSignedUrl(filePath, uploadUrlData.token, file);

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(filePath);
        targetVideoUrl = publicUrl;
        setUploadedVideoUrl(publicUrl);
      }

      toast.info('Drafting AI Scripts...');

      // 3. Call backend API to process via Gemini (Don't pass userScript so it doesn't try to parse 'custom' inside AI)
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl: targetVideoUrl, userScript: "" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate scripts');
      }

      if (result.data) {
        setScripts(result.data);
        toast.success('Scripts generated successfully!');
      }

    } catch (err: any) {
      console.error('Processing error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 flex flex-col relative overflow-hidden font-sans">
      {/* Subtle modern gradient background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 via-black to-black pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex h-16 items-center justify-between border-b border-white/5 px-6 shrink-0 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3 font-semibold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Studio Mode</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-white rounded-full transition-colors">
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {!videoPreviewUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full relative z-10 py-12">
             <div className="flex flex-col items-center mb-10">
               <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center mb-6 text-balance leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">Script</span> your video.
               </h1>
               <p className="text-zinc-400 text-center max-w-xl text-lg sm:text-xl text-balance">
                 Generate viral TikTok & Reels scripts perfectly matched to the visual cuts in your footage.
               </p>
             </div>
             <div className="w-full p-1 rounded-2xl bg-gradient-to-b from-white/5 to-transparent relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <UploadZone onFileSelect={handleFileSelect} disabled={isProcessing} />
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
             {/* Left/Center Column: Studio Player */}
             <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="rounded-xl overflow-hidden border border-zinc-800/80 bg-black shadow-2xl relative w-full aspect-[9/16] sm:aspect-video flex items-center justify-center max-h-[60vh] ring-1 ring-white/5 mx-auto group">
                   <video 
                     ref={videoRef}
                     src={videoPreviewUrl} 
                     controls 
                     controlsList="nodownload"
                     playsInline
                     className="w-full h-full object-contain"
                     onTimeUpdate={handleTimeUpdate}
                     onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                   />
                   <CaptionOverlay 
                     currentTime={currentTime} 
                     blocks={activeScriptBlocks} 
                     position={captionPosition}
                     onPositionChange={setCaptionPosition}
                     videoRef={videoRef}
                   />
                </div>

                {/* Real-time Custom Script Edit Box */}
                <div className="flex flex-col gap-3">
                   <Label htmlFor="script" className="text-sm font-medium tracking-wide text-zinc-300 ml-1">
                     Your Custom Script
                   </Label>
                   <div className="relative group">
                     <textarea
                       id="script"
                       placeholder="E.g. Paste a script here. It will automatically space out perfectly along your video timeline..." 
                       className="w-full min-h-[140px] resize-y bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/50 text-base leading-relaxed p-4 rounded-xl shadow-inner transition-all duration-300 group-hover:border-zinc-700 custom-scrollbar"
                       value={userScript}
                       onChange={(e) => handleLocalCustomEdit(e.target.value)}
                     />
                     <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-xs font-mono font-medium text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">{userScript.length} chars</span>
                     </div>
                   </div>
                   
                   <Button 
                     size="lg" 
                     className="w-full mt-2 py-6 font-medium text-base shadow-[0_0_20px_rgba(var(--primary),0.15)] bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 rounded-xl"
                     onClick={processVideo}
                     disabled={isProcessing}
                   >
                     {isProcessing ? (
                       <div className="flex items-center">
                         <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                         Scanning Visual Context...
                       </div>
                     ) : (
                       <div className="flex items-center">
                         <Sparkles className="w-5 h-5 mr-2" />
                         Generate AI Templates
                       </div>
                     )}
                   </Button>
                   
                   <StoryboardDetails activeScriptId={activeScriptId} blocks={activeScriptBlocks} />
                </div>
             </div>

             {/* Right Column: Script Switcher */}
             <div className="lg:col-span-1 border border-zinc-800/80 rounded-2xl bg-zinc-950/50 backdrop-blur-sm p-6 shadow-2xl h-fit sticky top-6">
                <ScriptSidebar 
                  scripts={scripts}
                  isAnalyzing={isProcessing}
                  onSelectScript={handleSelectScript}
                  activeScriptId={activeScriptId}
                  customScriptBlocks={customBlocks}
                />
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
