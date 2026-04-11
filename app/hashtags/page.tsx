'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clapperboard, Hash, Copy, Check, RefreshCw, Loader2, Sparkles, LogOut, Film, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/upload-zone';
import { ThemeToggle } from '@/components/theme-toggle';
import { CreditBadge } from '@/components/usage-guard';
import { SubmitButton } from '@/components/submit-button';
import { useStudio, type HashtagPayload } from '@/contexts/studio-context';
import { useGuestAuth } from '@/hooks/useGuestAuth';
import { logout } from '@/app/login/actions';
import { needsOptimization, optimizeVideoForAI } from '@/utils/video-compressor';

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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all border select-none cursor-pointer ${isKept
        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground hover:border-primary/40'
        }`}
    >
      {isKept && <Check className="w-3 h-3 shrink-0" />}
      {tag}
    </motion.button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HashtagsPage() {
  const router = useRouter();
  const { uploadedVideoUrl, setUploadedVideoUrl, videoPreviewUrl, setVideoPreviewUrl, hashtags, setHashtags } = useStudio();
  const { user, credits, isGuest, isUpgrading } = useGuestAuth();

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [userHint, setUserHint] = useState('');

  const handleUpgrade = async () => router.push('/login');

  // ── File selection ────────────────────────────────────────────────────────
  const handleFileSelect = (selectedFile: File) => {
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > MAX_SIZE) {
      toast.error('File is too large. Please select a video under 100MB.');
      return;
    }
    setFile(selectedFile);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(URL.createObjectURL(selectedFile));
    setUploadedVideoUrl(null);
  };

  // ── Upload video to Supabase if needed ────────────────────────────────────
  const uploadVideoIfNeeded = async (): Promise<string | null> => {
    if (uploadedVideoUrl) return uploadedVideoUrl;
    if (!file) { toast.error('Please select a video first.'); return null; }
    if (!user) { toast.error('Session not ready. Please refresh.'); return null; }

    let fileToUpload = file;
    if (needsOptimization(file)) {
      toast.info('Optimizing video for analysis…');
      try {
        fileToUpload = await optimizeVideoForAI(file, () => { });
      } catch {
        toast.error('Video optimization failed. Uploading original.');
      }
    }

    // Step 1: Get a signed upload URL from our API
    const fileExt = 'mp4';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    toast.info('Uploading to secure storage…');
    const uploadUrlRes = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });

    const uploadUrlData = await uploadUrlRes.json();
    if (!uploadUrlRes.ok) {
      toast.error(uploadUrlData.error || 'Failed to generate secure upload link.');
      return null;
    }

    // Step 2: PUT the file directly to Supabase storage using the signed URL
    // Robust MIME type handling: try to detect from file, fallback to video/mp4
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

    // Step 3: Build the public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${filePath}`;
    setUploadedVideoUrl(publicUrl);
    return publicUrl;
  };

  // ── Run Gemini hashtag analysis ───────────────────────────────────────────
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

      toast.success(isRefresh ? 'Fresh suggestions ready!' : 'Hashtags generated!');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Toggle keep/remove a hashtag ─────────────────────────────────────────
  const toggleTag = (tag: string) => {
    if (!hashtags) return;
    const isKept = hashtags.kept.includes(tag);
    const newKept = isKept
      ? hashtags.kept.filter((t) => t !== tag)
      : [...hashtags.kept, tag];
    setHashtags({ ...hashtags, kept: newKept });
  };

  // ── Copy all kept hashtags ────────────────────────────────────────────────
  const copyKept = async () => {
    if (!hashtags?.kept.length) return;
    await navigator.clipboard.writeText(hashtags.kept.join(' '));
    setIsCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const hasVideo = Boolean(uploadedVideoUrl || file);
  const suggestions = hashtags ? [...(hashtags.core ?? []), ...(hashtags.trending ?? [])] : [];
  const unselected = suggestions.filter((t) => !hashtags?.kept.includes(t));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
      {/* Gradient bg accent */}
      <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex h-16 items-center justify-between border-b border-border px-6 shrink-0 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 font-semibold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <span className="text-foreground">Studio Mode</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Back to Script Studio */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <Clapperboard className="w-3.5 h-3.5" />
            Scripts
          </Link>

          <CreditBadge credits={credits} isGuest={isGuest} onUpgrade={handleUpgrade} />

          {!isGuest ? (
            <form action={logout}>
              <SubmitButton variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground rounded-full transition-colors" pendingText="Logging out…">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </SubmitButton>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-full transition-colors text-xs font-medium"
            >
              Save my work →
            </Button>
          )}

          <ThemeToggle />
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left: Upload Panel ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
              <Hash className="w-6 h-6 text-primary" />
              Hashtag Studio
            </h1>
            <p className="text-sm text-muted-foreground">
              AI analyzes your video and generates custom hashtags. Select the ones you like, then get more.
            </p>
          </div>

          {/* Video status banner if already uploaded from Script Studio */}
          {uploadedVideoUrl && !file && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
              <div>
                <p className="font-medium text-foreground">Video ready from Script Studio</p>
                <p className="text-xs text-muted-foreground mt-0.5">No re-upload needed — using the same video.</p>
              </div>
            </div>
          )}

          {/* Upload zone — only shown if no video yet */}
          {!uploadedVideoUrl && (
            <UploadZone onFileSelect={handleFileSelect} disabled={isAnalyzing} />
          )}

          {/* Optional user hint textarea */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <MessageSquarePlus className="w-4 h-4 text-muted-foreground" />
              Context hint
              <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
            </label>
            <textarea
              value={userHint}
              onChange={(e) => setUserHint(e.target.value)}
              placeholder={`Describe your video or drop example hashtags for better results.

E.g. "Dubai rooftop golden hour shoot, luxurious vibes, use Arabic slang" or paste: #yallavibes #goldenhour`}
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 text-sm p-3 leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Analyze button */}
          <Button
            onClick={() => runAnalysis(false)}
            disabled={!hasVideo || isAnalyzing}
            className="h-11 font-semibold shadow-sm"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Video…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Analyze Hashtags</>
            )}
          </Button>

          {/* Get more button */}
          {hashtags && (
            <Button
              variant="outline"
              onClick={() => runAnalysis(true)}
              disabled={isAnalyzing}
              className="h-10 text-sm"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Getting suggestions…</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Get More Suggestions</>
              )}
            </Button>
          )}
        </div>

        {/* ── Right: Hashtag Studio Panel ───────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* My Hashtags (kept) */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                My Hashtags
                {hashtags?.kept.length ? (
                  <span className="text-xs font-normal text-muted-foreground">({hashtags.kept.length})</span>
                ) : null}
              </h2>
              {hashtags?.kept.length ? (
                <Button variant="ghost" size="sm" onClick={copyKept} className="h-7 text-xs gap-1.5">
                  {isCopied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy all</>}
                </Button>
              ) : null}
            </div>

            <AnimatePresence mode="sync">
              {hashtags?.kept.length ? (
                <div className="flex flex-wrap gap-2">
                  {hashtags.kept.map((tag) => (
                    <HashtagChip key={tag} tag={tag} isKept onClick={() => toggleTag(tag)} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {hashtags ? 'Click a suggestion below to keep it here.' : 'Analyze a video to see suggestions.'}
                </p>
              )}
            </AnimatePresence>
          </div>

          {/* Suggestions */}
          {hashtags && (
            <>
              {/* Core */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground mb-1">Core — specific to this video</h2>
                <p className="text-xs text-muted-foreground mb-4">Highly relevant to your exact content.</p>
                <AnimatePresence mode="sync">
                  <div className="flex flex-wrap gap-2">
                    {hashtags.core.map((tag) => (
                      <HashtagChip
                        key={tag}
                        tag={tag}
                        isKept={hashtags.kept.includes(tag)}
                        onClick={() => toggleTag(tag)}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </div>

              {/* Trending */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground mb-1">Trending — community reach</h2>
                <p className="text-xs text-muted-foreground mb-4">Popular niche hashtags matched to your content.</p>
                <AnimatePresence mode="sync">
                  <div className="flex flex-wrap gap-2">
                    {hashtags.trending.map((tag) => (
                      <HashtagChip
                        key={tag}
                        tag={tag}
                        isKept={hashtags.kept.includes(tag)}
                        onClick={() => toggleTag(tag)}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </div>
              {/* Cultural / Vibes */}
              {(hashtags as any).cultural?.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-1">🌍 Cultural Vibes</h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    International slang & cultural flavour — mix Arabic, Hindi, Japanese, Spanish & more.
                  </p>
                  <AnimatePresence mode="sync">
                    <div className="flex flex-wrap gap-2">
                      {(hashtags as any).cultural.map((tag: string) => (
                        <HashtagChip
                          key={tag}
                          tag={tag}
                          isKept={hashtags.kept.includes(tag)}
                          onClick={() => toggleTag(tag)}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
