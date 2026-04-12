'use client';

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { useStudio } from "@/contexts/studio-context";

export default function LandingPage() {
  const { videoPreviewUrl } = useStudio();
  const hasActiveProject = !!videoPreviewUrl;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex items-center justify-center overflow-hidden px-6">
          {/* Background Gradients */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-container/30 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-container/20 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto text-center mt-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low text-primary text-[11px] font-bold uppercase tracking-widest mb-8 animate-pulse">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              AI-Powered Excellence
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-on-surface leading-[1.1] mb-8">
              Script your video with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AI precision</span>
            </h1>
            
            <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Transform your raw ideas into viral-ready scripts. ViralScript uses advanced algorithmic sequencing to ensure your content hooks and holds every viewer.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/studio">
                <button className="bg-primary-container text-on-primary-container dark:bg-primary dark:text-on-primary px-10 py-4 rounded-full font-bold text-lg shadow-[0_20px_40px_rgba(0,83,221,0.08)] hover:bg-primary-container/80 dark:hover:bg-primary-dim hover:scale-105 active:scale-95 transition-all">
                  {hasActiveProject ? "Return to Studio" : "Start for Free"}
                </button>
              </Link>
              
              <Link href="/hashtags">
                <button className="bg-surface-container-lowest text-primary px-10 py-4 rounded-full font-bold text-lg border border-outline-variant/15 hover:bg-surface-container-low transition-all">
                  Try Hashtag Studio
                </button>
              </Link>
            </div>
            
            <p className="mt-6 text-[10px] md:text-xs font-semibold text-on-surface-variant opacity-80 uppercase tracking-wide">
              No account required to start • 3 free analyses included
            </p>
            
            {/* Floating Visual Element */}
            <div className="mt-16 md:mt-20 relative mx-auto max-w-4xl antigravity-float hidden md:block">
              <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 bg-surface-container-lowest p-2">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-surface-container-high to-background border border-outline-variant/10 flex flex-col items-center justify-center gap-4 text-primary relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,83,221,0.05)_0%,transparent_100%)]"></div>
                  <span className="material-symbols-outlined text-6xl opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>video_library</span>
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Studio Interface Preview</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Features Grid */}
        <section className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-outline-variant/5">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto text-primary">
                <span className="material-symbols-outlined text-2xl">movie</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-on-surface">Smart Sequencing</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Upload raw B-roll. The AI analyzes visual cuts and spaces the script perfectly along your timeline.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-outline-variant/5">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto text-primary">
                <span className="material-symbols-outlined text-2xl">bolt</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-on-surface">Multiple Hooks</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Choose between aesthetic, funny, educational modes or design a fully custom prompt for your brand.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-outline-variant/5">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto text-primary">
                <span className="material-symbols-outlined text-2xl">tag</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-on-surface">Targeted Hashtags</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Generate core, trending, and cultural hashtags explicitly tuned for your content's specific vibe.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-outline-variant/15 bg-surface-bright dark:bg-background">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
            © 2024 ViralScript AI. All rights reserved.
          </div>
          <div className="flex gap-8">
            <a className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all" href="#">Privacy Policy</a>
            <a className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all" href="#">Terms of Service</a>
            <a className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all" href="#">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
