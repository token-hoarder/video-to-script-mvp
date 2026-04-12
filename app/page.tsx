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
                <img 
                  className="w-full h-full object-cover rounded-2xl" 
                  alt="Minimalist user interface showing a video script editor" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAr0uLvRsPqIee_gsyh_HN5JnD2A92hOKBpP9UjNkrwoxJ3a0kOnjIRf8uNzDMdRZRrz4CTz76nhh5w0J5h2WfaDv2nA3axFTBH5lTnnSZisZWWyIBl3fTRzyQ_d0eIQjtflo1kIZhdefYXW-Qavbeepqz39X8w9FK76bNCrZ_3toAzAo2kU45jbmH-PJDB1ZHM7QTpb5Gz2xsA_JeTrL5FV0zZSCdL74mPj_4bJnjZH9fZ-tu3Ed7Nwd84NcCQA42mAUdO3u7XPPk-" 
                />
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
                <div className="mt-8 rounded-2xl overflow-hidden aspect-[16/7] bg-surface-container-low">
                  <img 
                    className="w-full h-full object-cover opacity-80" 
                    alt="abstract visual representation of a data sequence" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA--gIa1-ymAGA9BIlv1-sTdb_vPsmDz9xtVujnvr8CJiMZ_IDsB6feJE-Da9qhYS2sdAaLBbrksabs1oBC2tOb-3s4zBHFFvPE_iIi8c6kxT13R8GFfRdywgt6dPL9IKrCsP0JZ8CQvu0GpqunFQjfBLUYI9YI9LVms7OnUZx_57Z6mR9d4d3PYK5u-dDL3jLZfUmSLLo6HuFV6Pi26bhAkr6lXxGElDkKnTG4_M2iW49T8D-NIhjy8Ylgne1a8yuU03qIWl-v6uA_" 
                  />
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
              <div className="hidden lg:block w-1/3 aspect-square rounded-2xl overflow-hidden">
                <img 
                  className="w-full h-full object-cover" 
                  alt="professional content creator studio setup" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuCQE7AxCMzRDKKm7Ia20PQNop_0a4-HvrJRipfDf_NBnga0PPr_DYbPoS1i2JEYSLLlCeaa4n3T5aH1GoNPqDmmQp9ZGEiwy8a9lsS9Mc_hcbcxh3-rLkKfVSCIVHjW7SDqGrrw-qgXal2sJn8Eldxki65kQGVcUMHNtKBHhhvIzmtm6kCWcaNYNTDFaqLXtxgux15tOcVNEIM3oxJvSuFFNn_p0SDRf5WCbnY5vKT4vHqtPktKUXJY8LV0Q7KcSRzPkwvhqWe6Vj" 
                />
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
