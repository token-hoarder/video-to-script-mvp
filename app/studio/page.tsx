'use client';

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ScriptSidebar, ScriptsPayload } from "@/components/script-sidebar";
import { StoryboardDetails } from "@/components/storyboard-details";
import { CaptionOverlay } from "@/components/caption-overlay";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { needsOptimization, optimizeVideoForAI } from "@/utils/video-compressor";
import { toast } from "sonner";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { createClient } from "@/utils/supabase/client";
import { logout } from "@/app/login/actions";
import { useStudio } from "@/contexts/studio-context";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userScript, setUserScript] = useState("");
  
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

  // Shared persistent state from StudioContext
  const { uploadedVideoUrl, setUploadedVideoUrl, videoPreviewUrl, setVideoPreviewUrl, scripts, setScripts } = useStudio();

  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const { user, credits, isGuest, isLoading: authLoading, isUpgrading, refreshCredits } = useGuestAuth();

  const handleUpgrade = async () => router.push('/login');

  useEffect(() => {
    const savedScript = localStorage.getItem("video-to-script-custom");
    if (savedScript) setUserScript(savedScript);
  }, []);

  useEffect(() => {
    localStorage.setItem("video-to-script-custom", userScript);
  }, [userScript]);

  const chunkScriptLocal = (text: string, duration: number) => {
    if (!text || text.trim() === '') return [];
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
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    if (selectedFile.size > MAX_SIZE) {
      toast.error('File is too large. Please select a video under 500MB.');
      return;
    }
    setFile(selectedFile);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(URL.createObjectURL(selectedFile));
    setActiveScriptId(null);
    setActiveScriptBlocks([]);
    setScripts(null);
    setUploadedVideoUrl(null);
  };

  const uploadVideoIfNeeded = async (): Promise<string | null> => {
    if (uploadedVideoUrl) return uploadedVideoUrl;
    if (!file) { toast.error('Please select a video first'); return null; }
    if (!user) { toast.error('Session not ready. Please refresh.'); return null; }

    let fileToUpload = file;
    if (needsOptimization(file)) {
      toast.info('Optimizing for AI Analysis...');
      setCompressionProgress(0);
      try {
        fileToUpload = await optimizeVideoForAI(file, (progress) => {
          setCompressionProgress(progress);
        });
      } catch (compressionErr: any) {
        toast.error('Video optimization failed', { description: compressionErr?.message });
        fileToUpload = file;
      } finally {
        setCompressionProgress(null);
      }
    }

    const fileExt = 'mp4';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    toast.info('Uploading to secure storage...');

    const uploadUrlRes = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });
    const uploadUrlData = await uploadUrlRes.json();
    if (!uploadUrlRes.ok) throw new Error(uploadUrlData.error);

    const publicUrl = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrlData.signedUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${uploadUrlData.token}`);
      xhr.setRequestHeader('Content-Type', fileToUpload.type || 'video/mp4');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress((event.loaded / event.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(filePath);
          resolve(publicUrl);
        } else reject(new Error(`Upload failed`));
      };
      xhr.onerror = () => { setUploadProgress(null); reject(new Error('Network error')); };
      xhr.send(fileToUpload);
    });

    setUploadProgress(null);
    setUploadedVideoUrl(publicUrl);
    return publicUrl;
  };

  const handleGenerateScript = async (slotId: string) => {
    if (!file && !uploadedVideoUrl) return;
    try {
      setAnalyzingSlot(slotId);
      const targetVideoUrl = await uploadVideoIfNeeded();
      if (!targetVideoUrl) { setAnalyzingSlot(null); return; }

      toast.info(`Drafting Script...`);
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: targetVideoUrl, generateMode: slotId }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 402) {
          toast.error(result.error, {
            description: 'Sign in with Google to unlock 50 credits.',
            action: { label: 'Unlock 50 Credits →', onClick: handleUpgrade },
            duration: 8000,
          });
          return;
        }
        throw new Error(result.error || 'Failed to generate scripts');
      }

      if (result.data) {
        setScripts(result.data);
        if (result.data[slotId] && result.data[slotId].length > 0) {
           handleSelectScript(slotId, result.data[slotId]);
        }
        toast.success('Script generated successfully!');
        refreshCredits();
      }
    } catch (err: any) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           fileUrl: uploadedVideoUrl, 
           refineRequest: { slotId, currentBlocks: scripts[slotId], instruction }
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      if (result.data) {
        setScripts(result.data);
        handleSelectScript(slotId, result.data[slotId]);
        toast.success(`Successfully remixed the script!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to refine the script.');
    } finally {
      setRefiningSlot(null);
    }
  };

  const handleGenerateCustomAI = async (prompt: string) => {
    if (!file && !uploadedVideoUrl) return;
    try {
      setRefiningSlot('custom_ai');
      const targetVideoUrl = await uploadVideoIfNeeded();
      if (!targetVideoUrl) { setRefiningSlot(null); return; }

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: targetVideoUrl, customPrompt: prompt }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      if (result.data) {
        setScripts(result.data);
        if (result.data.custom_ai) handleSelectScript('custom_ai', result.data.custom_ai);
        toast.success(`Generated custom AI script!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate custom script.');
    } finally {
      setRefiningSlot(null);
    }
  };

  return (
    <div className="bg-background text-on-surface h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300">
      <AppHeader />

      {/* 3-Column Studio Layout */}
      <main className="flex-1 flex pt-[72px] overflow-hidden">
        
        {/* Left Sidebar (App Shell Mock) */}
        <aside className="hidden md:flex w-64 h-full flex-col gap-2 p-4 border-r border-outline-variant/10 bg-surface-container-lowest/50 shadow-sm shrink-0">
          <div className="px-4 py-2 mb-4">
            <h2 className="text-lg font-bold text-primary">Project Studio</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-outline-variant/80">Pro Editing Workspace</p>
          </div>
          <nav className="space-y-1">
             <div className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-xl font-bold transition-transform translate-x-1 cursor-default">
               <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
               <span className="text-sm">AI Scripts</span>
             </div>
             <Link href="/hashtags" className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface rounded-xl transition-all font-semibold">
               <span className="material-symbols-outlined text-[20px]">tag</span>
               <span className="text-sm">Hashtag Generator</span>
             </Link>
             <div className="flex items-center gap-3 p-3 text-on-surface-variant/40 rounded-xl cursor-not-allowed font-semibold">
               <span className="material-symbols-outlined text-[20px]">video_library</span>
               <span className="text-sm">Media Library</span>
             </div>
             <div className="flex items-center gap-3 p-3 text-on-surface-variant/40 rounded-xl cursor-not-allowed font-semibold">
               <span className="material-symbols-outlined text-[20px]">animation</span>
               <span className="text-sm">VFX / Transitions</span>
             </div>
          </nav>
          
          <div className="mt-auto p-4 bg-surface-container-low rounded-2xl flex items-center gap-3 border border-outline-variant/10">
             <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold shadow-inner">
                {user ? (isGuest ? 'G' : user.email?.substring(0,2).toUpperCase()) : 'G'}
             </div>
             <div>
                {(!user || isGuest) ? (
                  <p className="text-sm font-bold text-on-surface">Guest Mode</p>
                ) : (
                  <>
                    <p className="text-xs font-bold text-on-surface truncate max-w-[120px]">{user.email}</p>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Pro Member</p>
                  </>
                )}
             </div>
          </div>
        </aside>

        {!videoPreviewUrl ? (
          /* Empty State (Center Panel) */
          <div className="flex-1 flex overflow-hidden relative">
            <section className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center relative">
                <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="max-w-2xl w-full flex flex-col items-center text-center relative z-10 px-4">
                   <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-[0.2em] block mb-4">ViralScript</span>
                   <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold tracking-tight text-on-surface leading-tight mb-5">
                     Script your video.
                   </h1>
                   <p className="text-on-surface-variant text-base sm:text-lg max-w-xl mx-auto font-light mb-10">
                     Drop your footage — our AI watches it, then writes a time-synced viral script matched perfectly to your visual cuts.
                   </p>
                   
                   <label 
                     onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                     className="relative block w-full bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-primary-container hover:border-primary transition-colors flex flex-col items-center justify-center p-12 overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-primary/5"
                   >
                      <input type="file" ref={fileInputRef} className="hidden" accept="video/mp4,video/quicktime" onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
                      <div className="w-24 h-24 bg-primary-container/30 rounded-full flex items-center justify-center mb-6 shadow-[0_20px_40px_rgba(0,83,221,0.12)] text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-5xl">cloud_upload</span>
                      </div>
                      <h2 className="text-2xl font-bold text-on-surface mb-2">Drop your video here</h2>
                      <p className="text-on-surface-variant text-sm mb-12">Supports MP4, MOV up to 500MB</p>
                      
                      <div className="bg-primary-container text-on-primary-container dark:bg-primary dark:text-on-primary hover:bg-primary-container/80 dark:hover:bg-primary-dim px-10 py-4 rounded-full font-bold text-lg tracking-tight shadow-[0_24px_48px_rgba(0,83,221,0.1)] transition-all flex items-center gap-3">
                        Browse Files
                      </div>
                   </label>
                </div>
            </section>
          </div>
        ) : (
          /* Active Workspace (Center + Right) */
          <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden relative custom-scrollbar">
            {/* Center Panel: Video Preview */}
            <section className="flex-none lg:flex-1 flex flex-col lg:overflow-hidden bg-background relative z-10 p-4 md:p-6 lg:p-8 shrink-0">
               <div className="flex justify-between items-end mb-4 shrink-0">
                  <div>
                     <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface truncate max-w-sm">{file?.name || "Target Video"}</h1>
                     <p className="text-xs text-on-surface-variant flex items-center gap-1 font-medium mt-1">
                        <span className="material-symbols-outlined text-[14px]">play_circle</span> Analyzed Ready
                     </p>
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors cursor-pointer bg-surface-container-low px-3 py-1.5 rounded-full hover:bg-primary/10 border border-outline-variant/20">
                     Change
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="video/mp4,video/quicktime" onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
               </div>

               {/* Video Player Surface */}
               <div className="relative flex-1 bg-[#0a0f12] dark:bg-[#000000] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden group border border-outline-variant/10 flex items-center justify-center min-h-[40vh] md:min-h-0">
                  <video 
                     ref={videoRef}
                     src={videoPreviewUrl} 
                     controls 
                     controlsList="nodownload"
                     playsInline
                     preload="metadata"
                     disablePictureInPicture
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

                  {/* Progress overlay */}
                  {(compressionProgress !== null || uploadProgress !== null) && (
                    <div className="absolute inset-0 bg-inverse-surface/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-20">
                      <div className="text-center">
                        <p className="text-on-primary font-bold text-xl mb-2">
                          {uploadProgress !== null ? 'Uploading to Platform' : 'Optimizing Media'}
                        </p>
                        <p className="text-on-primary/70 text-sm font-medium">
                          {uploadProgress !== null ? 'Secure transfer in progress...' : 'Preparing high-speed proxy...'}
                        </p>
                      </div>
                      <div className="w-72">
                        <div className="flex justify-between text-[11px] uppercase tracking-widest font-bold text-primary-fixed mb-3">
                          <span>{uploadProgress !== null ? 'UPLOADING' : 'PROCESSING'}</span>
                          <span>{Math.round(uploadProgress ?? (compressionProgress! * 100))}%</span>
                        </div>
                        <div className="h-2 bg-on-primary/10 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-primary relative rounded-full transition-all duration-300"
                            style={{ width: `${Math.round(uploadProgress ?? (compressionProgress! * 100))}%` }}
                          >
                             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary mr-[-2px]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
               </div>

               {/* Storyboard Panel */}
               <div className="h-[30vh] shrink-0 overflow-y-auto mt-6 custom-scrollbar pr-2">
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
            </section>

            {/* Right Panel: PRO STUDIO Tools */}
            <aside className="hidden lg:flex w-80 md:w-[400px] shrink-0 p-6 flex-col overflow-y-auto relative z-20 custom-scrollbar bg-background text-on-surface">
               <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10 shadow-[0_20px_40px_rgba(0,83,221,0.03)] flex flex-col gap-6 relative overflow-hidden h-max min-h-full">
                  {/* Decorative glow */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
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
                    onClearScripts={() => { setScripts(null); setActiveScriptId(null); setActiveScriptBlocks([]); setUserScript(''); }}
                  />
               </div>
            </aside>
            
            {/* Mobile Script Sidebar (visible below video on small screens) */}
            <div className="lg:hidden px-4 pb-8 md:px-8 bg-background flex-none max-w-full">
               <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 shadow-[0_20px_40px_rgba(0,83,221,0.03)] flex flex-col gap-6 relative overflow-hidden max-w-full">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
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
                    onClearScripts={() => { setScripts(null); setActiveScriptId(null); setActiveScriptBlocks([]); setUserScript(''); }}
                  />
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
