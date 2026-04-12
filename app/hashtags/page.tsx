'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useStudio } from '@/contexts/studio-context';
import { useGuestAuth } from '@/hooks/useGuestAuth';
import { needsOptimization, optimizeVideoForAI } from '@/utils/video-compressor';
import { useRouter } from 'next/navigation';

// ── Hashtag Chip ──────────────────────────────────────────────────────────────
function HashtagChip({
  tag,
  isKept,
  onClick,
}: {
  tag: string;
  isKept: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-widest font-bold transition-all select-none cursor-pointer ${isKept
        ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(0,83,221,0.2)]'
        : 'bg-surface-container-low text-on-surface-variant hover:bg-primary-container/40 hover:text-primary border border-outline-variant/20'
        }`}
    >
      {isKept && <span className="material-symbols-outlined text-[14px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
      #{tag}
    </motion.button>
  );
}

export default function HashtagsPage() {
  const router = useRouter();
  const { uploadedVideoUrl, setUploadedVideoUrl, videoPreviewUrl, setVideoPreviewUrl, hashtags, setHashtags } = useStudio();
  const { user, isGuest } = useGuestAuth();

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [userHint, setUserHint] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpgrade = async () => router.push('/login');

  const handleFileSelect = (selectedFile: File) => {
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    if (selectedFile.size > MAX_SIZE) {
      toast.error('File is too large. Please select a video under 500MB.');
      return;
    }
    setFile(selectedFile);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(URL.createObjectURL(selectedFile));
    setUploadedVideoUrl(null);
  };

  const uploadVideoIfNeeded = async (): Promise<string | null> => {
    if (uploadedVideoUrl) return uploadedVideoUrl;
    if (!file) { toast.error('Please select a video first.'); return null; }
    if (!user) { toast.error('Session not ready. Please refresh.'); return null; }

    let fileToUpload = file;
    if (needsOptimization(file)) {
      toast.info('Optimizing video for AI analysis…');
      try {
        fileToUpload = await optimizeVideoForAI(file, () => { });
      } catch {
        toast.error('Video optimization failed. Uploading original.');
      }
    }

    const fileExt = 'mp4';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    toast.info('Uploading securely...');
    const uploadUrlRes = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });

    const uploadUrlData = await uploadUrlRes.json();
    if (!uploadUrlRes.ok) {
      toast.error(uploadUrlData.error || 'Failed to generate secure upload.');
      return null;
    }

    const contentType = fileToUpload.type || 'video/mp4';
    const directUploadRes = await fetch(uploadUrlData.signedUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${uploadUrlData.token}`,
        'Content-Type': contentType,
      },
      body: fileToUpload,
    });

    if (!directUploadRes.ok) {
      const errText = await directUploadRes.text();
      toast.error(`Upload failed: ${errText}`);
      return null;
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${filePath}`;
    setUploadedVideoUrl(publicUrl);
    return publicUrl;
  };

  const runAnalysis = async (isRefresh = false) => {
    setIsAnalyzing(true);
    try {
      const videoUrl = await uploadVideoIfNeeded();
      if (!videoUrl) return;

      const keptSoFar = isRefresh ? (hashtags?.kept ?? []) : [];

      const res = await fetch('/api/generate-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: videoUrl, excludeHashtags: keptSoFar, userHint: userHint.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          toast.error(result.error, {
            description: 'Sign in with Google to unlock 50 credits.',
            action: { label: 'Unlock 50 Credits →', onClick: handleUpgrade },
            duration: 8000,
          });
          return;
        }
        throw new Error(result.error || 'Failed to generate hashtags');
      }

      setHashtags({
        core: result.data.core,
        trending: result.data.trending,
        cultural: result.data.cultural ?? [],
        kept: keptSoFar,
      });

      toast.success(isRefresh ? 'Refined suggestions ready!' : 'Hashtags generated!');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (!hashtags) return;
    const isKept = hashtags.kept.includes(tag);
    const newKept = isKept
      ? hashtags.kept.filter((t) => t !== tag)
      : [...hashtags.kept, tag];
    setHashtags({ ...hashtags, kept: newKept });
  };

  const copyKept = async () => {
    if (!hashtags?.kept.length) return;
    await navigator.clipboard.writeText(hashtags.kept.map(t => `#${t}`).join(' '));
    setIsCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const hasVideo = Boolean(uploadedVideoUrl || file || videoPreviewUrl);

  return (
    <div className="bg-background text-on-surface h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300">
      <AppHeader />
      
      <main className="flex-1 flex pt-[72px] overflow-hidden">
        
        {/* Left Sidebar (App Shell Mock) */}
        <aside className="hidden md:flex w-64 h-full flex-col gap-2 p-4 border-r border-outline-variant/10 bg-surface-container-lowest/50 shadow-sm shrink-0">
          <div className="px-4 py-2 mb-4">
            <h2 className="text-lg font-bold text-primary">Project Studio</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-outline-variant/80">Pro Editing Workspace</p>
          </div>
          <nav className="space-y-1">
             <Link href="/studio" className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface rounded-xl transition-all font-semibold">
               <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
               <span className="text-sm">AI Scripts</span>
             </Link>
              <div className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-xl font-bold transition-transform translate-x-1 cursor-default">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>tag</span>
                <span className="text-sm">Hashtag Generator</span>
              </div>
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

        <section className="flex-1 overflow-y-auto px-6 md:px-8 pb-12 pt-12 relative custom-scrollbar">
          <div className="max-w-7xl mx-auto">
          
          <div className="mb-12 text-center md:text-left">
            <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-[0.2em] block mb-3">Optimize Discovery</span>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-on-surface leading-tight mb-4">Hashtag Studio</h1>
            <p className="text-on-surface-variant text-base sm:text-lg max-w-2xl font-light mx-auto md:mx-0">
              Generate optimized hashtags for your video to improve reach and engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Context Hint & My Hashtags */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Context Hint */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_20px_40px_rgba(0,83,221,0.04)] ring-1 ring-outline-variant/10">
                <label className="text-[11px] font-bold text-on-surface uppercase tracking-widest block mb-4">Context Hint <span className="opacity-50">(Optional)</span></label>
                <div className="relative group">
                  <textarea 
                    value={userHint}
                    onChange={(e) => setUserHint(e.target.value)}
                    className="w-full h-28 bg-surface-container-low border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant resize-none text-on-surface" 
                    placeholder="Describe your video niche (e.g. tech unboxing, aesthetic vlog)..."
                  />
                </div>
              </div>

              {/* My Hashtags (kept) */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_20px_40px_rgba(0,83,221,0.04)] ring-1 ring-outline-variant/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    My Selection
                    {hashtags?.kept.length ? (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">{hashtags.kept.length}</span>
                    ) : null}
                  </h3>
                  
                  {hashtags?.kept.length ? (
                    <div className="flex gap-2">
                      <button onClick={copyKept} className="text-[11px] font-semibold text-primary hover:text-primary-dim uppercase tracking-wider flex items-center gap-1">
                        {isCopied ? <><span className="material-symbols-outlined text-[14px]">check</span> Copied</> : <><span className="material-symbols-outlined text-[14px]">content_copy</span> Copy</>}
                      </button>
                    </div>
                  ) : null}
                </div>

                <AnimatePresence mode="popLayout">
                  {hashtags?.kept.length ? (
                    <div className="flex flex-wrap gap-2">
                      {hashtags.kept.map((tag) => (
                        <HashtagChip key={tag} tag={tag} isKept onClick={() => toggleTag(tag)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4 border-2 border-dashed border-outline-variant/30 rounded-2xl">
                      <span className="material-symbols-outlined text-outline-variant/50 text-3xl mb-2">sell</span>
                      <p className="text-[11px] text-on-surface-variant font-medium uppercase tracking-widest leading-relaxed">No Hashtags Kept<br/>Select from suggestions below</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Dynamic Action Area */}
            <div className="lg:col-span-8 h-full">
              {!hashtags ? (
                /* Upload & Drag/Drop Zone */
                <label 
                  onDragOver={(e) => { e.preventDefault(); /* setup drag state */ }}
                  onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                  className="relative block w-full h-full min-h-[500px] bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-primary-container hover:border-primary transition-colors flex flex-col items-center justify-center p-12 overflow-hidden group cursor-pointer"
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept="video/mp4,video/quicktime,video/x-msvideo" onChange={(e) => { if(e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
                  
                  {/* Floating Glowing Orbs bg */}
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                  <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
                  
                  <div className="relative z-10 text-center flex flex-col items-center w-full">
                    
                    {file || videoPreviewUrl ? (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-32 h-32 rounded-3xl overflow-hidden mb-8 shadow-2xl relative">
                          <video src={videoPreviewUrl || undefined} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                          </div>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-on-surface mb-2 truncate max-w-sm">{file?.name || "Video Loaded"}</h2>
                        <p className="text-primary text-sm font-semibold mb-8 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span> Ready for Analysis</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-24 h-24 bg-primary-container/30 rounded-full flex items-center justify-center mb-8 shadow-[0_20px_40px_rgba(0,83,221,0.12)] text-primary group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-5xl">cloud_upload</span>
                        </div>
                        <h2 className="text-2xl font-bold text-on-surface mb-2">Drop your video here</h2>
                        <p className="text-on-surface-variant text-sm mb-12">Supports MP4, MOV up to 500MB</p>
                      </>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {hasVideo ? (
                        <button 
                          onClick={(e) => { e.preventDefault(); runAnalysis(); }}
                          disabled={isAnalyzing}
                          className="bg-primary-container text-on-primary-container dark:bg-primary dark:text-on-primary hover:bg-primary-container/80 dark:hover:bg-primary-dim px-10 py-4 rounded-full font-bold text-lg tracking-tight shadow-[0_24px_48px_rgba(0,83,221,0.1)] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-70 disabled:scale-100 relative z-20"
                        >
                          {isAnalyzing ? "Analyzing..." : "Analyze Hashtags"}
                          <span className={`material-symbols-outlined text-2xl ${isAnalyzing ? "animate-spin" : ""}`} style={{ fontVariationSettings: "'FILL' 1" }}>{isAnalyzing ? "progress_activity" : "auto_awesome"}</span>
                        </button>
                      ) : (
                        <div className="bg-primary-container text-on-primary-container dark:bg-primary dark:text-on-primary hover:bg-primary-container/80 dark:hover:bg-primary-dim px-10 py-4 rounded-full font-bold text-lg tracking-tight shadow-[0_24px_48px_rgba(0,83,221,0.1)] transition-all flex items-center gap-3">
                          Browse Files
                        </div>
                      )}
                      {hasVideo && !isAnalyzing && (
                        <div className="flex items-center gap-4 mt-2">
                           <div className="text-[11px] font-bold text-outline-variant uppercase tracking-widest hover:text-primary transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}>Change video</div>
                           <div className="text-[11px] font-bold text-outline-variant uppercase tracking-widest hover:text-error transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setFile(null); setUploadedVideoUrl(null); setVideoPreviewUrl(null); setUserHint(''); }}>Remove video</div>
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              ) : (
                /* Generated Suggestions Panel */
                <div className="w-full h-full min-h-[500px] flex flex-col gap-6">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2">AI Suggestions <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span></h3>
                      <p className="text-sm text-on-surface-variant">Tap to move them to your selection.</p>
                    </div>
                    <button 
                      onClick={() => runAnalysis(true)}
                      disabled={isAnalyzing}
                      className="bg-surface-container-highest hover:bg-primary/10 text-primary-dim px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${isAnalyzing ? "animate-spin" : ""}`}>progress_activity</span> {isAnalyzing ? "Regenerating" : "More"}
                    </button>
                  </div>

                  {/* Core Tags */}
                  <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_20px_40px_rgba(0,83,221,0.03)] border border-outline-variant/10">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-on-surface mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Core Relevance</h4>
                    <div className="flex flex-wrap gap-2">
                      {hashtags.core.map((tag) => (
                        <HashtagChip key={tag} tag={tag} isKept={hashtags.kept.includes(tag)} onClick={() => toggleTag(tag)} />
                      ))}
                    </div>
                  </div>

                  {/* Trending Tags */}
                  <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_20px_40px_rgba(0,83,221,0.03)] border border-outline-variant/10">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-on-surface mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-secondary" /> Algorithm Trending</h4>
                    <div className="flex flex-wrap gap-2">
                      {hashtags.trending.map((tag) => (
                        <HashtagChip key={tag} tag={tag} isKept={hashtags.kept.includes(tag)} onClick={() => toggleTag(tag)} />
                      ))}
                    </div>
                  </div>

                  {/* Cultural Tags */}
                  {(hashtags as any).cultural?.length > 0 && (
                    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_20px_40px_rgba(0,83,221,0.03)] border border-outline-variant/10">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-on-surface mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-tertiary" /> Cultural Vibes</h4>
                      <div className="flex flex-wrap gap-2">
                        {(hashtags as any).cultural.map((tag: string) => (
                          <HashtagChip key={`cult-${tag}`} tag={tag} isKept={hashtags.kept.includes(tag)} onClick={() => toggleTag(tag)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reset Results */}
                  <div className="mt-4 flex justify-end">
                     <button onClick={() => { setHashtags(null); setUserHint(''); }} className="text-[10px] font-bold uppercase tracking-widest text-outline-variant hover:text-error transition-colors flex items-center gap-1">
                       <span className="material-symbols-outlined text-[14px]">delete</span> Reset Results
                     </button>
                  </div>
                </div>
              )}
            </div>

          </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-outline-variant/15 bg-surface-bright dark:bg-background mt-auto hidden">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
            © 2024 ViralScript AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
