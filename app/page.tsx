'use client';

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Clapperboard, Hash } from "lucide-react";
import { useStudio } from "@/contexts/studio-context";

export default function LandingPage() {
  const { videoPreviewUrl } = useStudio();
  const hasActiveProject = !!videoPreviewUrl;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      <AppHeader />
      
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-[50vh] bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8 py-20 pb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="w-4 h-4" />
            Viral Scripts in Seconds
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-balance leading-tight">
            Script your video with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              AI precision
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground text-balance max-w-2xl leading-relaxed">
            Drop your raw footage. Our AI watches every frame and writes perfectly timed, captivating captions and hashtags engineered for maximum engagement.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            {hasActiveProject ? (
              <Link href="/studio">
                <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform duration-200">
                  Return to Studio
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href="/studio">
                <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform duration-200">
                  Start for Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            )}
            
            <Link href="/hashtags">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-full border-border hover:bg-muted transition-colors">
                Try Hashtag Studio
                <Hash className="w-5 h-5 ml-2 text-muted-foreground" />
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 font-medium">
            No account required to start • 3 free analyses included
          </p>
        </div>

        {/* Feature Grid */}
        <div className="relative z-10 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full pb-24">
          <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-card border border-border/50 shadow-sm transition-all hover:border-primary/30 hover:shadow-md group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Clapperboard className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Sequencing</h3>
            <p className="text-muted-foreground text-base leading-relaxed">Upload raw B-roll. The AI analyzes visual cuts and spaces the script perfectly along your timeline.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-card border border-border/50 shadow-sm transition-all hover:border-primary/30 hover:shadow-md group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Multiple Hooks</h3>
            <p className="text-muted-foreground text-base leading-relaxed">Choose between aesthetic, funny, educational modes or design a fully custom prompt for your brand.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-card border border-border/50 shadow-sm transition-all hover:border-primary/30 hover:shadow-md group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Hash className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Targeted Hashtags</h3>
            <p className="text-muted-foreground text-base leading-relaxed">Generate core, trending, and cultural hashtags explicitly tuned for your content's specific vibe.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
