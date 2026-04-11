'use client';

/**
 * StudioContext — Shared state across Script Studio (/) and Hashtag Studio (/hashtags).
 *
 * Why: Next.js App Router unmounts pages on navigation, destroying local useState.
 * Placing shared state here (at layout level) keeps it alive across page switches.
 *
 * State that lives here:
 *   - uploadedVideoUrl  — Supabase public URL (avoids re-upload when switching pages)
 *   - videoPreviewUrl   — Local blob URL for the <video> element
 *   - scripts           — All generated script slots (ScriptsPayload)
 *   - hashtags          — { core, trending, kept } generated hashtag sets
 *
 * Persisted to localStorage: uploadedVideoUrl, scripts, hashtags.kept
 * NOT persisted: videoPreviewUrl (blob URLs die on refresh)
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ScriptsPayload } from '@/components/script-sidebar';
export type { ScriptsPayload };

export interface HashtagPayload {
  core: string[];
  trending: string[];
  cultural: string[];
  kept: string[];
}

interface StudioContextValue {
  uploadedVideoUrl: string | null;
  setUploadedVideoUrl: (url: string | null) => void;
  videoPreviewUrl: string | null;
  setVideoPreviewUrl: (url: string | null) => void;
  scripts: ScriptsPayload | null;
  setScripts: (scripts: ScriptsPayload | null) => void;
  hashtags: HashtagPayload | null;
  setHashtags: (hashtags: HashtagPayload | null) => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [uploadedVideoUrl, setUploadedVideoUrlRaw] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [scripts, setScriptsRaw] = useState<ScriptsPayload | null>(null);
  const [hashtags, setHashtagsRaw] = useState<HashtagPayload | null>(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedVideoUrl = localStorage.getItem('studio-uploaded-video-url');
      if (savedVideoUrl) setUploadedVideoUrlRaw(savedVideoUrl);

      const savedScripts = localStorage.getItem('studio-scripts');
      if (savedScripts) setScriptsRaw(JSON.parse(savedScripts));

      const savedKept = localStorage.getItem('studio-hashtags-kept');
      if (savedKept) {
        setHashtagsRaw({ core: [], trending: [], kept: JSON.parse(savedKept) });
      }
    } catch {
      // Silently fail if localStorage is unavailable (SSR guard)
    }
  }, []);

  // Persist uploadedVideoUrl
  const setUploadedVideoUrl = (url: string | null) => {
    setUploadedVideoUrlRaw(url);
    if (url) {
      localStorage.setItem('studio-uploaded-video-url', url);
    } else {
      localStorage.removeItem('studio-uploaded-video-url');
    }
  };

  // Persist scripts
  const setScripts = (s: ScriptsPayload | null) => {
    setScriptsRaw(s);
    if (s) {
      localStorage.setItem('studio-scripts', JSON.stringify(s));
    } else {
      localStorage.removeItem('studio-scripts');
    }
  };

  // Persist only the kept hashtags (core/trending are transient suggestions)
  const setHashtags = (h: HashtagPayload | null) => {
    setHashtagsRaw(h);
    if (h) {
      localStorage.setItem('studio-hashtags-kept', JSON.stringify(h.kept));
    } else {
      localStorage.removeItem('studio-hashtags-kept');
    }
  };

  return (
    <StudioContext.Provider
      value={{
        uploadedVideoUrl,
        setUploadedVideoUrl,
        videoPreviewUrl,
        setVideoPreviewUrl,
        scripts,
        setScripts,
        hashtags,
        setHashtags,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used inside <StudioProvider>');
  return ctx;
}
