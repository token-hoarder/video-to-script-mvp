'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Smile, Droplet, GraduationCap, Tv, Play, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export type ScriptBlock = { timestamp: string; text: string };

export type StoryboardSegment = {
  startTime: number;
  endTime: number;
  text: string;
  visualTrigger: string;
  isEdited: boolean;
};

export type ScriptsPayload = {
  funny: ScriptBlock[];
  aesthetic: ScriptBlock[];
  educational: ScriptBlock[];
} | StoryboardSegment[];

interface ScriptCardsProps {
  scripts?: ScriptsPayload | null;
  onSelectScript?: (id: string, blocks: any[]) => void;
  activeScriptId?: string | null;
  isLoading: boolean;
}

export function ScriptCards({ scripts, onSelectScript, activeScriptId, isLoading }: ScriptCardsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (id: string, blocks: ScriptBlock[]) => {
    const text = blocks.map(b => `[${b.timestamp}] ${b.text}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Generated script copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyStoryboardSegment = async (idx: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(`seg-${idx}`);
    toast.success('Segment text copied to clipboard!');
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

  if (Array.isArray(scripts)) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4" /> Custom Storyboard Sequence
          </div>
          {onSelectScript && (
            <Button
              variant="outline"
              size="sm"
              className={`h-7 px-3 text-xs tracking-wider transition-all duration-300 ${activeScriptId === 'custom' ? 'bg-primary/20 border-primary/50 text-primary hover:bg-primary/30' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              onClick={() => onSelectScript('custom', scripts)}
            >
              <Play className="w-3 h-3 mr-1.5" />
              {activeScriptId === 'custom' ? 'Viewing Preview' : 'Preview on Video'}
            </Button>
          )}
        </h3>
        {scripts.map((segment, idx) => (
          <Card key={idx} className={`border-zinc-800 bg-zinc-950 shadow-none hover:shadow-lg transition-all duration-300 ${activeScriptId === 'custom' ? 'border-primary/30 bg-primary/5 shadow-primary/5' : ''}`}>
            <CardContent className="pt-6 relative">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30 font-mono">
                      [{segment.startTime}s - {segment.endTime}s]
                    </span>
                    {segment.isEdited && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase tracking-wide">
                        Edited to Fit
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-zinc-500 hover:text-white"
                    onClick={() => copyStoryboardSegment(idx, segment.text)}
                  >
                    {copiedId === `seg-${idx}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="text-xs font-medium text-zinc-400 italic bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                  🎥 {segment.visualTrigger}
                </div>
                <div className="text-sm text-zinc-200 pl-1 leading-relaxed">
                  {segment.text}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(scripts).map(([key, blocks]) => (
        <Card key={key} className={`border-zinc-800 bg-zinc-950 shadow-none hover:shadow-lg transition-all duration-300 ${activeScriptId === key ? 'border-primary/50 shadow-[0_0_15px_rgba(255,255,255,0.05)] bg-zinc-900' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col space-y-1">
              <CardTitle className="capitalize flex items-center gap-2 text-zinc-100">
                {getIcon(key)} {key} Script
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs">A suggested voiceover flow aligned with video timing</CardDescription>
            </div>
            <div className="flex gap-2">
              {onSelectScript && (
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs ${activeScriptId === key ? 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20' : 'text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'}`}
                  onClick={() => onSelectScript(key, blocks)}
                >
                  <Play className="w-3 h-3 mr-1" />
                  {activeScriptId === key ? 'Previewing' : 'Preview'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-white border-zinc-700 hover:bg-zinc-800 hover:text-white"
                onClick={() => copyToClipboard(key, blocks)}
              >
                {copiedId === key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
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
