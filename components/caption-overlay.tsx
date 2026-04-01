export interface CaptionOverlayProps {
  currentTime: number;
  blocks: any[]; // Supports both ScriptBlock[] and StoryboardSegment[]
}

export function CaptionOverlay({ currentTime, blocks }: CaptionOverlayProps) {
  if (!blocks || blocks.length === 0) return null;

  // Normalization logic: find the active block
  const activeBlock = blocks.find((block) => {
    // Handling newly structured Director Mode schemas
    if (typeof block.startTime === 'number' && typeof block.endTime === 'number') {
      return currentTime >= block.startTime && currentTime <= block.endTime;
    }

    // Checking string 'timestamp' format generated from standard modes like [00:00 - 00:05]
    if (typeof block.timestamp === 'string') {
      const match = block.timestamp.match(/(\d+):(\d+)(?:\s*-\s*(\d+):(\d+))?/);
      if (match) {
        const startSec = parseInt(match[1] || '0') * 60 + parseInt(match[2] || '0');
        let endSec = startSec + 4; // Defaults to 4 seconds if no end block provided
        if (match[3] && match[4]) {
           endSec = parseInt(match[3]) * 60 + parseInt(match[4]);
        }
        return currentTime >= startSec && currentTime <= endSec;
      }
    }
    return false;
  });

  if (!activeBlock || activeBlock.text === '[Visual Break]' || activeBlock.text.trim() === '') return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-8 p-4 z-50 overflow-hidden">
      <div 
        className="text-white font-bold text-center text-lg md:text-xl lg:text-2xl tracking-wide max-w-[90%] break-words leading-snug"
        style={{
          textShadow: `
            -1px -1px 0 #000,  
             1px -1px 0 #000,
            -1px  1px 0 #000,
             1px  1px 0 #000,
             0px  2px 4px rgba(0,0,0,0.8)
          `
        }}
      >
        {activeBlock.text}
      </div>
    </div>
  );
}
