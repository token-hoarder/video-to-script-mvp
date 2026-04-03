import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Tv, CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface StoryboardDetailsProps {
  activeScriptId: string | null;
  blocks: any[];
  pendingEdits: Record<number, string>;
  onPendingEditChange: (idx: number, val: string) => void;
  onSaveSegment: (idx: number) => void;
  onUndoSegment: (idx: number) => void;
  onSaveAll: () => void;
  onScrubVideo: (time: number) => void;
}

export function StoryboardDetails({ 
  activeScriptId, 
  blocks,
  pendingEdits,
  onPendingEditChange,
  onSaveSegment,
  onUndoSegment,
  onSaveAll,
  onScrubVideo
}: StoryboardDetailsProps) {
  const [copied, setCopied] = useState(false);

  if (!activeScriptId || !blocks || blocks.length === 0) return null;

  const getTimestamps = (segment: any) => {
    let start = 0; let end = 0;
    if (typeof segment.startTime === 'number') { start = segment.startTime; end = segment.endTime; }
    else if (typeof segment.timestamp === 'string') {
        const match = segment.timestamp.match(/(\d+):(\d+)(?:\s*-\s*(\d+):(\d+))?/);
        if (match) {
          start = parseInt(match[1]||'0') * 60 + parseInt(match[2]||'0');
          end = match[3] && match[4] ? parseInt(match[3]) * 60 + parseInt(match[4]) : start + 4;
        }
    }
    return { start, end };
  };

  const handleCopy = () => {
    const textToCopy = blocks.map((segment, idx) => {
      const { start, end } = getTimestamps(segment);
      const textToUse = pendingEdits[idx] !== undefined ? pendingEdits[idx] : segment.text;

      if (textToUse === '[Visual Break]') {
        return `[${start.toFixed(1)}s] (Visual Break)`; 
      }
      return `[${start.toFixed(1)}s - ${end.toFixed(1)}s] ${textToUse}`;
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

  const hasPendingEdits = Object.keys(pendingEdits).length > 0;

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2">
           <Tv className="w-4 h-4 text-primary" /> {getTitle()}
        </h3>
        <div className="flex items-center gap-2">
          {hasPendingEdits && (
            <Button
              variant="default"
              size="sm"
              className="h-8 text-[11px] font-semibold px-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-md shadow-[0_0_10px_rgba(var(--primary),0.3)]"
              onClick={onSaveAll}
            >
              Commit All Changes
            </Button>
          )}
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
      </div>
      <Card className="border-zinc-800 bg-zinc-950/30 backdrop-blur-md relative overflow-hidden group transition-all duration-300">
        <CardContent className="p-0">
          <div className="flex flex-col divide-y divide-zinc-800/40 w-full overflow-hidden">
            {blocks.map((segment, idx) => {
              const { start, end } = getTimestamps(segment);
              const isDirty = pendingEdits[idx] !== undefined;
              const currentText = isDirty ? pendingEdits[idx] : segment.text;

              return (
                <div key={idx} className={`flex flex-col gap-1.5 p-4 transition-all relative group/row ${isDirty ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-zinc-900/40 border-l-2 border-l-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono font-semibold text-primary/70 whitespace-nowrap pt-0.5 tracking-wider uppercase flex items-center shrink-0">
                      {start.toFixed(1)}s - {end.toFixed(1)}s
                      {isDirty && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]" title="Unsaved changes" />}
                    </div>
                    {isDirty && (
                      <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                        <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-6 w-6 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded-full"
                           onClick={() => onSaveSegment(idx)}
                           title="Save Segment (Commit)"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-6 w-6 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"
                           onClick={() => onUndoSegment(idx)}
                           title="Undo Draft"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <textarea
                    value={currentText}
                    onChange={(e) => onPendingEditChange(idx, e.target.value)}
                    onFocus={() => onScrubVideo(start)}
                    className={`w-full text-sm leading-relaxed tracking-wide resize-none bg-transparent outline-none transition-all duration-200 border rounded-md p-2 mt-1 min-h-[50px] custom-scrollbar
                      ${isDirty ? 'border-primary/30 focus:border-primary/50 text-white' : 'border-transparent hover:border-zinc-800 focus:border-zinc-700 focus:bg-zinc-950/60 text-zinc-300'}
                      ${segment.text === '[Visual Break]' && !isDirty ? 'italic text-zinc-500' : ''}`}
                    placeholder="Enter segment text..."
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
