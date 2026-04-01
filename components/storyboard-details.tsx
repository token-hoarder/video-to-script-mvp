import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Tv } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface StoryboardDetailsProps {
  activeScriptId: string | null;
  blocks: any[];
}

export function StoryboardDetails({ activeScriptId, blocks }: StoryboardDetailsProps) {
  const [copied, setCopied] = useState(false);

  if (!activeScriptId || !blocks || blocks.length === 0) return null;

  const handleCopy = () => {
    const textToCopy = blocks.map(segment => {
      // Robust handling of timestamps generated from standard array outputs
      let start = 0;
      let end = 0;

      if (typeof segment.startTime === 'number') {
        start = segment.startTime;
        end = segment.endTime;
      } else if (typeof segment.timestamp === 'string') {
        const match = segment.timestamp.match(/(\d+):(\d+)(?:\s*-\s*(\d+):(\d+))?/);
        if (match) {
          start = parseInt(match[1] || '0') * 60 + parseInt(match[2] || '0');
          if (match[3] && match[4]) {
            end = parseInt(match[3]) * 60 + parseInt(match[4]);
          } else {
            end = start + 4;
          }
        }
      }

      if (segment.text === '[Visual Break]') {
        return `[${start.toFixed(1)}s] (Visual Break)`; 
      }
      return `[${start.toFixed(1)}s - ${end.toFixed(1)}s] ${segment.text}`;
    }).join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Storyboard copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getTitle = () => {
    switch (activeScriptId) {
       case 'custom': return 'Your Custom Script Segments';
       case 'aesthetic': return 'Aesthetic Mode Storyboard';
       case 'funny': return 'Funny / Meme Mode Storyboard';
       case 'educational': return 'Educational Mode Storyboard';
       default: return 'Storyboard Details';
    }
  };

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2">
           <Tv className="w-4 h-4 text-primary" /> {getTitle()}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-[11px] font-medium px-3 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800 transition-all rounded-md"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3 h-3 mr-1.5 text-green-500" /> : <Copy className="w-3 h-3 mr-1.5" />}
          {copied ? 'Copied' : 'Copy Text'}
        </Button>
      </div>
      <Card className="border-zinc-800 bg-zinc-950/30 backdrop-blur-md relative overflow-hidden group transition-all duration-300">
        <CardContent className="p-0">
          <div className="flex flex-col divide-y divide-zinc-800/40 w-full overflow-hidden">
            {blocks.map((segment, idx) => {
              let start = 0; let end = 0;
              if (typeof segment.startTime === 'number') { start = segment.startTime; end = segment.endTime; }
              else if (typeof segment.timestamp === 'string') {
                 const match = segment.timestamp.match(/(\d+):(\d+)(?:\s*-\s*(\d+):(\d+))?/);
                 if (match) {
                   start = parseInt(match[1]||'0') * 60 + parseInt(match[2]||'0');
                   end = match[3] && match[4] ? parseInt(match[3]) * 60 + parseInt(match[4]) : start + 4;
                 }
              }

              return (
                <div key={idx} className="flex gap-4 p-4 hover:bg-zinc-900/40 transition-colors">
                  <div className="text-[11px] font-mono font-semibold text-primary/70 whitespace-nowrap pt-0.5 w-[95px] tracking-wider uppercase shrink-0">
                    {start.toFixed(1)}s - {end.toFixed(1)}s
                  </div>
                  <p className={`text-sm leading-relaxed tracking-wide ${segment.text === '[Visual Break]' ? 'text-zinc-500 italic' : 'text-zinc-200'}`}>
                    {segment.text}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
