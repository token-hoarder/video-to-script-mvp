'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface CaptionOverlayProps {
  currentTime: number;
  blocks: any[]; // Supports both ScriptBlock[] and StoryboardSegment[]
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function CaptionOverlay({ currentTime, blocks, position, onPositionChange, videoRef }: CaptionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [safeBounds, setSafeBounds] = useState({ width: '100%', height: '100%' });

  useEffect(() => {
    if (!videoRef?.current) return;
    const video = videoRef.current;
    
    const updateBounds = () => {
      const vW = video.videoWidth;
      const vH = video.videoHeight;
      const cW = video.clientWidth;
      const cH = video.clientHeight;
      if (!vW || !vH || !cW || !cH) return;
      
      const videoRatio = vW / vH;
      const containerRatio = cW / cH;
      let w = cW;
      let h = cH;
      
      if (videoRatio > containerRatio) {
        h = cW / videoRatio;
      } else {
        w = cH * videoRatio;
      }
      setSafeBounds({ width: `${w}px`, height: `${h}px` });
    };

    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(video);
    video.addEventListener('loadedmetadata', updateBounds);
    return () => {
      observer.disconnect();
      video.removeEventListener('loadedmetadata', updateBounds);
    }
  }, [videoRef]);

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

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-50">
      <div 
        ref={containerRef} 
        className="relative flex items-end justify-center pb-12 p-4" 
        style={{ width: safeBounds.width, height: safeBounds.height }}
      >
        {activeBlock && activeBlock.text !== '[Visual Break]' && activeBlock.text.trim() !== '' && (
          <motion.div 
            drag
            dragConstraints={containerRef}
            dragElastic={0}
            dragMomentum={false}
            initial={{ x: position.x, y: position.y }}
            onDragEnd={(e, info) => {
              onPositionChange({
                x: position.x + info.offset.x,
                y: position.y + info.offset.y
              });
            }}
            whileDrag={{ cursor: 'grabbing' }}
            className="pointer-events-auto text-white font-medium text-center tracking-wide max-w-[90%] whitespace-normal break-words leading-relaxed text-balance bg-black/20 backdrop-blur-md rounded-xl drop-shadow-md cursor-grab active:cursor-grabbing hover:outline-dashed hover:outline-2 hover:outline-white/30 focus-within:outline-dashed focus-within:outline-2 focus-within:outline-white/30"
            style={{ 
              containerType: 'inline-size', 
              resize: 'both', 
              overflow: 'hidden', 
              minWidth: '150px', 
              minHeight: '50px',
              fontSize: 'clamp(0.875rem, 4cqi, 2.5rem)',
              padding: '0.75rem 1rem'
            }}
          >
            {activeBlock.text}
          </motion.div>
        )}
      </div>
    </div>
  );
}
