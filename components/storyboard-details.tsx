import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
       case 'custom_ai': return 'Custom Mix Storyboard';
       default: return 'Storyboard Details';
    }
  };

  const hasPendingEdits = Object.keys(pendingEdits).length > 0;

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
           <span className="material-symbols-outlined text-primary text-[18px]">movie</span> {getTitle()}
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
            className="h-8 text-[11px] font-medium px-3 text-muted-foreground hover:text-foreground border border-transparent hover:bg-surface-container-high transition-all rounded-md"
            onClick={handleCopy}
          >
            {copied ? <span className="material-symbols-outlined text-[16px] mr-1.5 text-green-500">check</span> : <span className="material-symbols-outlined text-[16px] mr-1.5">content_copy</span>}
            {copied ? 'Copied' : 'Copy Text'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] font-medium px-3 text-muted-foreground hover:text-foreground border border-transparent hover:bg-surface-container-high transition-all rounded-md ml-1"
            onClick={() => {
              const text = blocks.map((segment, idx) => {
                const { start, end } = getTimestamps(segment);
                const textToUse = pendingEdits[idx] !== undefined ? pendingEdits[idx] : segment.text;
                if (textToUse === '[Visual Break]') return `[${start.toFixed(1)}s] (Visual Break)`;
                return `[${start.toFixed(1)}s - ${end.toFixed(1)}s] ${textToUse}`;
              }).join('\n');
              
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `script-${activeScriptId}-${Date.now()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('Script downloaded!');
            }}
          >
            <span className="material-symbols-outlined text-[16px] mr-1.5">download</span>
            Download .txt
          </Button>
        </div>
      </div>
      <Card className="border-border/50 bg-surface-container-lowest backdrop-blur-md relative overflow-hidden group transition-all duration-300 shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col divide-y divide-border/50 w-full overflow-hidden">
            {blocks.map((segment, idx) => {
              const { start, end } = getTimestamps(segment);
              const isDirty = pendingEdits[idx] !== undefined;
              const currentText = isDirty ? pendingEdits[idx] : segment.text;

              return (
                <div key={idx} className={`flex flex-col gap-1.5 p-4 transition-all relative group/row ${isDirty ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-surface-container-low border-l-2 border-l-transparent'}`}>
                  <div className="flex items-start justify-between">
                    <button 
                       onClick={() => onScrubVideo(start)}
                       className="text-[11px] font-mono font-semibold text-primary hover:text-primary-dim hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap tracking-wider uppercase flex items-center shrink-0 cursor-pointer"
                       title="Jump to this frame in video"
                    >
                      {start.toFixed(1)}s - {end.toFixed(1)}s
                      {isDirty && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),0.8)]" title="Unsaved changes" />}
                    </button>
                    
                    <div className="flex items-center gap-1 opacity-60 group-hover/row:opacity-100 transition-opacity">
                      {isDirty && (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200 mr-2">
                          <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/10 rounded-full flex items-center justify-center"
                             onClick={() => onSaveSegment(idx)}
                             title="Save Segment (Commit)"
                          >
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          </Button>
                          <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full flex items-center justify-center"
                             onClick={() => onUndoSegment(idx)}
                             title="Undo Draft"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </Button>
                        </div>
                      )}
                      <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-border/50 rounded-full flex items-center justify-center"
                         onClick={() => {
                           navigator.clipboard.writeText(currentText);
                           toast.success('Segment copied!');
                         }}
                         title="Copy this segment"
                      >
                         <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={currentText}
                    onChange={(e) => {
                       onPendingEditChange(idx, e.target.value);
                       e.target.style.height = 'auto';
                       e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onFocus={(e) => {
                       onScrubVideo(start);
                       e.target.style.height = 'auto';
                       e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    className={`w-full text-sm leading-relaxed tracking-wide resize-none bg-transparent outline-none transition-all duration-200 rounded-md p-1.5 min-h-[30px] overflow-hidden -ml-1.5
                      ${isDirty ? 'text-foreground' : 'text-foreground/80'}
                      ${segment.text === '[Visual Break]' && !isDirty ? 'italic text-muted-foreground' : ''}`}
                    placeholder="Enter segment text..."
                    rows={1}
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
