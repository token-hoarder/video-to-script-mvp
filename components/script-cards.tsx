'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Tv, Smile, GraduationCap, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export type ScriptBlock = { timestamp: string; text: string };
export type ScriptsPayload = {
  funny: ScriptBlock[];
  aesthetic: ScriptBlock[];
  educational: ScriptBlock[];
};

interface ScriptCardsProps {
  scripts?: ScriptsPayload | null;
  isLoading: boolean;
}

export function ScriptCards({ scripts, isLoading }: ScriptCardsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (id: string, blocks: ScriptBlock[]) => {
    const text = blocks.map(b => `[${b.timestamp}] ${b.text}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Generated script copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'funny': return <Smile className="w-5 h-5 text-amber-500" />;
      case 'aesthetic': return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'educational': return <GraduationCap className="w-5 h-5 text-blue-400" />;
      default: return <Tv className="w-5 h-5 text-zinc-400" />;
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse border-zinc-800 bg-zinc-950">
            <CardHeader className="pb-2">
              <div className="h-6 bg-zinc-800 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-zinc-800 rounded w-full"></div>
                <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
                <div className="h-4 bg-zinc-800 rounded w-4/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!scripts) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-950/50">
        <Tv className="w-12 h-12 text-zinc-600 mb-4" />
        <p className="text-zinc-400">Upload a video to see generated scripts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(scripts).map(([key, blocks]) => (
        <Card key={key} className="border-zinc-800 bg-zinc-950 shadow-none hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col space-y-1">
              <CardTitle className="capitalize flex items-center gap-2 text-zinc-100">
                {getIcon(key)} {key} Script
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs">A suggested voiceover flow aligned with video timing</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-white border-zinc-700 hover:bg-zinc-800 hover:text-white"
              onClick={() => copyToClipboard(key, blocks)}
            >
              {copiedId === key ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedId === key ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="text-xs font-mono text-primary/80 shrink-0 w-24 pt-1">
                    {block.timestamp}
                  </div>
                  <div className="text-sm text-zinc-300">
                    {block.text}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
