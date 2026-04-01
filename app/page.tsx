'use client';

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { UploadZone } from "@/components/upload-zone";
import { ScriptCards, ScriptsPayload } from "@/components/script-cards";
import { Button } from "@/components/ui/button";
import { LogOut, Film } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scripts, setScripts] = useState<ScriptsPayload | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const processVideo = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setScripts(null);

      // 1. Authenticate / get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload videos.');
        router.push('/login');
        return;
      }

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

      toast.info('Generating scripts using Gemini AI...');

      // 3. Call backend API to process via Gemini
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl: publicUrl }),
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
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Subtle modern gradient background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex h-16 items-center justify-between border-b border-white/5 px-6 shrink-0 bg-background/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 font-semibold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Cursive AI</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-white rounded-full transition-colors">
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-auto p-4 md:p-8 flex flex-col xl:flex-row gap-8 lg:gap-12 max-w-7xl mx-auto w-full">
        {/* Left Column: Upload */}
        <section className="flex-1 flex flex-col gap-6 max-w-2xl mx-auto xl:mx-0 w-full">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">Turn B-Roll into Scripts.</h1>
            <p className="text-zinc-400 text-base leading-relaxed">
              Upload your raw, silent b-roll footage and our multimodal AI will generate 3 different voiced scripts perfectly timed to your visual action.
            </p>
          </div>
          
          <div className="p-1 rounded-2xl bg-gradient-to-b from-white/5 to-transparent">
            <UploadZone onFileSelect={setFile} disabled={isProcessing} />
          </div>
          
          <Button 
            className="w-full text-white py-6 text-base font-medium rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all data-[disabled]:opacity-50"
            disabled={!file || isProcessing}
            onClick={processVideo}
          >
            {isProcessing ? 'Processing Frameworks...' : 'Analyze & Generate Sequences'}
          </Button>

          {isProcessing && (
            <div className="text-sm text-center text-primary/80 animate-pulse font-medium">
              Scanning visual context... This may take up to a minute.
            </div>
          )}
        </section>

        {/* Right Column: Scripts */}
        <section className="flex-1 flex flex-col xl:w-1/2 mt-8 xl:mt-0 max-w-2xl mx-auto xl:mx-0 w-full">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1 text-white">Generated Scripts</h2>
            <p className="text-zinc-400 text-sm">
              Ready-to-use voiceover drafts
            </p>
          </div>
          <div className="flex-1 pb-10">
            <ScriptCards isLoading={isProcessing} scripts={scripts} />
          </div>
        </section>
      </main>
    </div>
  );
}
