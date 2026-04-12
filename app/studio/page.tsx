'use client';

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { UploadZone } from "@/components/upload-zone";
import { ScriptSidebar, ScriptsPayload } from "@/components/script-sidebar";
import { StoryboardDetails } from "@/components/storyboard-details";
import { CaptionOverlay } from "@/components/caption-overlay";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogOut, Film, Loader2, Hash } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { needsOptimization, optimizeVideoForAI } from "@/utils/video-compressor";
import { toast } from "sonner";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { CreditBadge } from "@/components/usage-guard";
import { createClient } from "@/utils/supabase/client";
import { logout } from "@/app/login/actions";
import { SubmitButton } from "@/components/submit-button";
import { useStudio } from "@/contexts/studio-context";
import Link from "next/link";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [userScript, setUserScript] = useState("");
  // videoPreviewUrl lives in shared context so /hashtags can show the same video
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(15);
  const [captionPosition, setCaptionPosition] = useState({ x: 0, y: 0 });

  const [currentTime, setCurrentTime] = useState(0);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [activeScriptBlocks, setActiveScriptBlocks] = useState<any[]>([]);
  const [pendingEdits, setPendingEdits] = useState<Record<number, string>>({});
  const [refiningSlot, setRefiningSlot] = useState<string | null>(null);

  const [analyzingSlot, setAnalyzingSlot] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Shared persistent state from StudioContext (survives navigation to /hashtags and back)
  const { uploadedVideoUrl, setUploadedVideoUrl, videoPreviewUrl, setVideoPreviewUrl, scripts, setScripts } = useStudio();

  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const { user, credits, isGuest, isLoading: authLoading, isUpgrading, refreshCredits } = useGuestAuth();

  const handleUpgrade = async () => router.push('/login');

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
       setPendingEdits({});
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleSelectScript = (id: string, blocks: any[]) => {
    setActiveScriptId(id);
    setActiveScriptBlocks(blocks);
    setPendingEdits({});
    
    // Auto-play and reset timeline when pressing Preview
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleSaveSegment = (idx: number) => {
     if (pendingEdits[idx] === undefined) return;
     const newBlocks = [...activeScriptBlocks];
     newBlocks[idx] = { ...newBlocks[idx], text: pendingEdits[idx] };
     setActiveScriptBlocks(newBlocks);
     
     if (activeScriptId === 'custom') {
        const fullText = newBlocks.filter(b => b.text !== '[Visual Break]').map(b => b.text).join(' ');
        setUserScript(fullText);
     }

     const newPending = { ...pendingEdits };
     delete newPending[idx];
     setPendingEdits(newPending);
  };

  const handleUndoSegment = (idx: number) => {
     const newPending = { ...pendingEdits };
     delete newPending[idx];
     setPendingEdits(newPending);
  };

  const handleSaveAll = () => {
     const newBlocks = [...activeScriptBlocks];
     Object.keys(pendingEdits).forEach(key => {
        const idx = parseInt(key);
        newBlocks[idx] = { ...newBlocks[idx], text: pendingEdits[idx] };
     });
     setActiveScriptBlocks(newBlocks);

     if (activeScriptId === 'custom') {
        const fullText = newBlocks.filter(b => b.text !== '[Visual Break]').map(b => b.text).join(' ');
        setUserScript(fullText);
     }

     setPendingEdits({});
     toast.success('All changes committed successfully');
  };

  const handlePendingEditChange = (idx: number, val: string) => {
     setPendingEdits(prev => ({ ...prev, [idx]: val }));
  };

  const handleScrubVideo = (time: number) => {
     if (videoRef.current) {
        videoRef.current.currentTime = time;
        videoRef.current.pause();
     }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    const newPreviewUrl = URL.createObjectURL(selectedFile);
    setVideoPreviewUrl(newPreviewUrl);
    setActiveScriptId(null);
    setActiveScriptBlocks([]);
    setScripts(null);
    setUploadedVideoUrl(null);
  };

  const handleLogout = async () => {
    console.log('DEBUG_AUTH: handleLogout() triggered — calling server action to destroy cookie');
    await logout();
  };

  const uploadVideoIfNeeded = async (): Promise<string | null> => {
    if (uploadedVideoUrl) return uploadedVideoUrl;
    if (!file) {
      toast.error('Please select a video first');
      return null;
    }
    if (!user) {
      toast.error('Session not ready. Please refresh.');
      return null;
    }

    let fileToUpload = file;
    if (needsOptimization(file)) {
      toast.info('Optimizing for AI Analysis...');
      setCompressionProgress(0);
      try {
        fileToUpload = await optimizeVideoForAI(file, (progress) => {
          setCompressionProgress(progress);
        });
      } catch (compressionErr: any) {
        toast.error('Video optimization failed. Uploading original file instead.', {
          description: compressionErr?.message,
        });
        fileToUpload = file;
      } finally {
        setCompressionProgress(null);
      }
    }

    const fileExt = 'mp4';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    toast.info('Uploading to secure storage...');
    console.log('DEBUG: Fetching /api/upload-url...');

    const uploadUrlRes = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });

    console.log('DEBUG: Got response from /api/upload-url', uploadUrlRes.status);
    const uploadUrlData = await uploadUrlRes.json();
    console.log('DEBUG: uploadUrlData parsed', uploadUrlData);
    
    if (!uploadUrlRes.ok) {
      throw new Error(uploadUrlData.error || 'Failed to generate secure upload link');
    }

    console.log('DEBUG: Starting direct XMLHttpRequest PUT upload...');
    
    // Using XMLHttpRequest instead of fetch to enable upload progress tracking
    const publicUrl = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrlData.signedUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${uploadUrlData.token}`);
      xhr.setRequestHeader('Content-Type', fileToUpload.type || 'video/mp4');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(filePath);
          resolve(publicUrl);
        } else {
          reject(new Error(`Upload failed (Status ${xhr.status}): ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        setUploadProgress(null);
        reject(new Error('Network error during upload'));
      };
      xhr.send(fileToUpload);
    });

    console.log('DEBUG: Direct upload finished. publicUrl:', publicUrl);
    setUploadProgress(null);
    setUploadedVideoUrl(publicUrl);
    return publicUrl;
  };

  const handleGenerateScript = async (slotId: string) => {
    if (!file && !uploadedVideoUrl) return;

    try {
      setAnalyzingSlot(slotId);
      
      const targetVideoUrl = await uploadVideoIfNeeded();
      if (!targetVideoUrl) {
         setAnalyzingSlot(null);
         return;
      }

      toast.info(`Drafting Script...`);

      // 3. Call backend API to process via Gemini
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl: targetVideoUrl, generateMode: slotId }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          // Credits exhausted — surface upgrade prompt
          toast.error(result.error, {
            description: 'Sign in with Google to unlock 50 credits.',
            action: {
              label: 'Unlock 50 Credits →',
              onClick: handleUpgrade,
            },
            duration: 8000,
          });
          return;
        }
        throw new Error(result.error || 'Failed to generate scripts');
      }

      if (result.data) {
        console.log('Scripts Received:', result.data);
        setScripts(result.data);
        
        if (result.data[slotId] && result.data[slotId].length > 0) {
           handleSelectScript(slotId, result.data[slotId]);
        }

        toast.success('Script generated successfully!');
        // Refresh credit display after successful generation
        refreshCredits();
      }

    } catch (err: any) {
      console.error('Processing error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setAnalyzingSlot(null);
    }
  };

  const handleRefineScript = async (slotId: string, instruction: string) => {
    if (!uploadedVideoUrl || !scripts || !scripts[slotId]) return;

    try {
      setRefiningSlot(slotId);
      
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
           fileUrl: uploadedVideoUrl, 
           refineRequest: {
              slotId,
              currentBlocks: scripts[slotId],
              instruction
           }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to refine script');
      }

      if (result.data) {
        setScripts(result.data);
        handleSelectScript(slotId, result.data[slotId]);
        toast.success(`Successfully remixed the script!`);
      }

    } catch (err: any) {
      console.error('Refinement error:', err);
      toast.error(err.message || 'Failed to refine the script.');
    } finally {
      setRefiningSlot(null);
    }
  };

  const handleGenerateCustomAI = async (prompt: string) => {
    if (!file && !uploadedVideoUrl) return;

    try {
      setRefiningSlot('custom_ai'); // reuse refiningSlot for localized loading tracking
      
      const targetVideoUrl = await uploadVideoIfNeeded();
      if (!targetVideoUrl) {
         setRefiningSlot(null);
         return;
      }

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
           fileUrl: targetVideoUrl, 
           customPrompt: prompt
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate custom script');
      }

      if (result.data) {
        setScripts(result.data);
        if (result.data.custom_ai) {
           handleSelectScript('custom_ai', result.data.custom_ai);
        }
        toast.success(`Generated custom AI script!`);
      }

    } catch (err: any) {
      console.error('Custom Generation error:', err);
      toast.error(err.message || 'Failed to generate custom script.');
    } finally {
      setRefiningSlot(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col relative overflow-hidden font-sans">
      {/* Subtle modern gradient background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <AppHeader />

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {!videoPreviewUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full relative z-10 py-12">
             <div className="flex flex-col items-center mb-10">
               {/* Eyebrow badge */}
               <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-5">
                 <span className="relative flex h-1.5 w-1.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                 </span>
                 AI-powered · No editing skills needed
               </div>

               <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center mb-5 text-balance leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60">Script</span> your video.
               </h1>
               <p className="text-muted-foreground text-center max-w-xl text-lg sm:text-xl text-balance mb-8">
                 Drop your TikTok or Reels footage — our AI watches it, then writes a time-synced viral script matched perfectly to your visual cuts.
               </p>

               {/* Feature pills */}
               <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                 <div className="flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-sm text-foreground border border-border">
                   <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.118a1 1 0 01-1.447.91L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                   AI reads your video
                 </div>
                 <div className="flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-sm text-foreground border border-border">
                   <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                   Captions sync to cuts
                 </div>
                 <div className="flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-sm text-foreground border border-border">
                   <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
                   4 style modes + custom
                 </div>
               </div>

               {/* Trust line */}
               <p className="text-xs text-muted-foreground/60 text-center">
                 Try free — no account needed · 3 analyses included
               </p>
             </div>
             <div className="w-full p-1 rounded-2xl bg-gradient-to-b from-white/5 to-transparent relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <UploadZone 
                  onFileSelect={handleFileSelect} 
                  disabled={analyzingSlot !== null || uploadProgress !== null} 
                  progress={uploadProgress ?? (compressionProgress !== null ? compressionProgress * 100 : null)}
                />
             </div>
          </div>

        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
             {/* Left/Center Column: Studio Player */}
             <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="rounded-xl overflow-hidden border border-border bg-black shadow-2xl relative w-full aspect-[9/16] sm:aspect-video flex items-center justify-center max-h-[60vh] ring-1 ring-border/50 mx-auto group">
                   <video 
                     ref={videoRef}
                     src={videoPreviewUrl} 
                     controls 
                     controlsList="nodownload"
                     playsInline
                     preload="metadata"
                     disablePictureInPicture
                     crossOrigin="anonymous"
                     className="w-full h-full object-contain"
                     onTimeUpdate={handleTimeUpdate}
                     onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                   />
                   <CaptionOverlay 
                     currentTime={currentTime} 
                     blocks={activeScriptBlocks.map((b, idx) => ({ ...b, text: pendingEdits[idx] !== undefined ? pendingEdits[idx] : b.text }))} 
                     position={captionPosition}
                     onPositionChange={setCaptionPosition}
                     videoRef={videoRef}
                   />
                   {/* Compression progress overlay */}
                   {/* Progress overlay (Optimization or Upload) */}
                   {(compressionProgress !== null || uploadProgress !== null) && (
                     <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                       <div className="text-center">
                         <p className="text-white font-semibold text-lg mb-1">
                           {uploadProgress !== null ? 'Uploading to Secure Storage' : 'Optimizing for AI Analysis'}
                         </p>
                         <p className="text-zinc-300 text-sm">
                           {uploadProgress !== null ? 'Almost there! Sending to storage...' : 'Preparing your video for the best results...'}
                         </p>
                       </div>
                       <div className="w-64">
                         <div className="flex justify-between text-xs text-zinc-300 mb-2 font-mono">
                           <span>{uploadProgress !== null ? 'UPLOADING' : 'PROCESSING'}</span>
                           <span>{Math.round(uploadProgress ?? (compressionProgress! * 100))}%</span>
                         </div>
                         <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                           <div 
                             className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                             style={{ width: `${Math.round(uploadProgress ?? (compressionProgress! * 100))}%` }}
                           />
                         </div>
                       </div>
                       <Loader2 className="w-5 h-5 text-primary animate-spin mt-1" />
                     </div>
                   )}
                </div>

                {/* Real-time Custom Script Edit Box */}
                <div className="flex flex-col gap-3">
                   <Label htmlFor="script" className="text-sm font-medium tracking-wide text-foreground ml-1">
                     Your Custom Script
                   </Label>
                   <div className="relative group">
                     <textarea
                       id="script"
                       placeholder="E.g. Paste a script here. It will automatically space out perfectly along your video timeline..." 
                       className="w-full min-h-[140px] resize-y bg-background border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 text-base leading-relaxed p-4 rounded-xl shadow-inner transition-all duration-300 group-hover:border-primary/30 custom-scrollbar"
                       value={userScript}
                       onChange={(e) => handleLocalCustomEdit(e.target.value)}
                     />
                     <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">{userScript.length} chars</span>
                     </div>
                   </div>
                   
                   
                   
                   <StoryboardDetails 
                     activeScriptId={activeScriptId} 
                     blocks={activeScriptBlocks} 
                     pendingEdits={pendingEdits}
                     onPendingEditChange={handlePendingEditChange}
                     onSaveSegment={handleSaveSegment}
                     onUndoSegment={handleUndoSegment}
                     onSaveAll={handleSaveAll}
                     onScrubVideo={handleScrubVideo}
                   />
                </div>
             </div>

             {/* Right Column: Script Switcher */}
             <div className="lg:col-span-1 border border-border rounded-2xl bg-card/80 backdrop-blur-sm p-6 shadow-xl h-fit sticky top-6">
                <ScriptSidebar 
                  scripts={scripts}
                  analyzingSlot={analyzingSlot}
                  onGenerateScript={handleGenerateScript}
                  onSelectScript={handleSelectScript}
                  activeScriptId={activeScriptId}
                  customScriptBlocks={customBlocks}
                  onRefineScript={handleRefineScript}
                  onGenerateCustomAI={handleGenerateCustomAI}
                  refiningSlot={refiningSlot}
                />
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
