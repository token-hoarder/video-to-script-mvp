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
                <button className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold text-lg shadow-[0_20px_40px_rgba(0,83,221,0.2)] hover:scale-105 active:scale-95 transition-all">
                  {hasActiveProject ? "Return to Studio" : "Start for Free"}
                </button>
              </Link>
              
              <Link href="/hashtags">
                <button className="bg-surface-container-lowest text-primary px-10 py-4 rounded-full font-bold text-lg border border-outline-variant/15 hover:bg-surface-container-low transition-all">
                  Try Hashtag Studio
                </button>
              </Link>
            </div>
            
            {/* Floating Visual Element */}
            <div className="mt-20 relative mx-auto max-w-4xl antigravity-float">
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

        {/* Features Bento Grid */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Engineered for Virality</h2>
            <div className="h-1.5 w-20 bg-primary mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Large Feature Card */}
            <div className="md:col-span-8 bg-surface-container-lowest rounded-3xl p-8 md:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,83,221,0.05)] transition-all group">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Smart Sequencing</h3>
                  <p className="text-on-surface-variant max-w-md leading-relaxed">
                    Our AI analyzes millions of top-performing videos to structure your script with the perfect narrative arc. From the first second to the final call to action.
                  </p>
                </div>
                <div className="mt-8 rounded-2xl overflow-hidden aspect-[16/7] bg-gradient-to-r from-primary/5 to-secondary-container/10 border border-outline-variant/5 flex flex-col items-center justify-center">
                   <div className="flex gap-2 items-end h-16 opacity-80">
                      <div className="w-4 bg-primary rounded-t-md animate-pulse h-full"></div>
                      <div className="w-4 bg-primary/80 rounded-t-md animate-pulse h-3/4" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-4 bg-primary/60 rounded-t-md animate-pulse h-1/2" style={{ animationDelay: '300ms' }}></div>
                      <div className="w-4 bg-primary/40 rounded-t-md animate-pulse h-full" style={{ animationDelay: '450ms' }}></div>
                      <div className="w-4 bg-secondary rounded-t-md animate-pulse h-2/3" style={{ animationDelay: '600ms' }}></div>
                   </div>
                   <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mt-4 opacity-50">Algorithmic Sequence</span>
                </div>
              </div>
            </div>

            {/* Small Feature Card 1 */}
            <div className="md:col-span-4 bg-gradient-to-br from-primary to-primary-dim rounded-3xl p-8 text-on-primary shadow-[0_20px_40px_rgba(0,83,221,0.2)]">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-2xl">rebase_edit</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Multiple Hooks</h3>
              <p className="text-on-primary/80 text-sm leading-relaxed mb-6">
                Don't bet on just one opening. We generate 5 unique high-retention hooks for every script.
              </p>
              <div className="space-y-3">
                <div className="bg-white/10 p-3 rounded-lg text-xs font-medium">"You won't believe what happens..."</div>
                <div className="bg-white/10 p-3 rounded-lg text-xs font-medium">"The secret to X is finally..."</div>
                <div className="bg-white/10 p-3 rounded-lg text-xs font-medium">"Stop scrolling if you want..."</div>
              </div>
            </div>

            {/* Small Feature Card 2 */}
            <div className="md:col-span-4 bg-surface-container-high rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-surface-container-lowest rounded-xl flex items-center justify-center mb-6 text-on-surface">
                  <span className="material-symbols-outlined text-2xl">tag</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Targeted Hashtags</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Context-aware hashtag generation that targets the right niche for maximum algorithmic reach.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold">#CONTENTCREATOR</span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold">#AIVIDEO</span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold">#VIRALSTRATEGY</span>
              </div>
            </div>

            {/* Medium Feature Card */}
            <div className="md:col-span-8 bg-surface-container-lowest rounded-3xl p-8 md:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,83,221,0.05)] flex items-center gap-8 border border-outline-variant/10 transition-all">
              <div className="hidden lg:flex w-1/3 aspect-square rounded-2xl bg-gradient-to-tr from-surface-container to-surface-container-high border border-outline-variant/10 items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="material-symbols-outlined text-7xl text-on-surface-variant/40 group-hover:scale-110 group-hover:text-primary transition-all duration-500 font-light">camera_video</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">Project Studio V1.0</h3>
                <p className="text-on-surface-variant leading-relaxed mb-6">
                  Manage all your video drafts in one centralized hub. Collaborative tools and version control built for modern teams.
                </p>
                <Link href="/studio" className="text-primary font-bold flex items-center gap-2 group">
                  Explore the Studio 
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>
            </div>
            
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 bg-surface-container">
          <div className="max-w-4xl mx-auto bg-surface-container-lowest rounded-[2rem] p-12 md:p-20 text-center shadow-xl relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight relative z-10">Ready to break the algorithm?</h2>
            <p className="text-on-surface-variant text-lg mb-10 max-w-xl mx-auto relative z-10">
              Join 50,000+ creators who use ViralScript to automate their creative workflow and dominate their niche.
            </p>
            <div className="relative z-10">
              <Link href="/studio">
                <button className="bg-primary text-on-primary px-12 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all">
                  Create My First Script
                </button>
              </Link>
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
