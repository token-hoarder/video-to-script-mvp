import { Button } from '@/components/ui/button';
import { useState } from 'react';

export type ScriptsPayload = {
  [key: string]: any[];
};

interface ScriptSidebarProps {
  scripts: ScriptsPayload | null;
  analyzingSlot: string | null;
  onGenerateScript: (slotId: string) => void;
  onSelectScript: (id: string, blocks: any[]) => void;
  activeScriptId: string | null;
  customScriptBlocks: any[];
  onRefineScript: (slotId: string, instruction: string) => void;
  onGenerateCustomAI: (prompt: string) => void;
  refiningSlot: string | null;
}

export function ScriptSidebar({ 
   scripts, 
   analyzingSlot, 
   onGenerateScript,
   onSelectScript, 
   activeScriptId, 
   customScriptBlocks,
   onRefineScript,
   onGenerateCustomAI,
   refiningSlot
}: ScriptSidebarProps) {
  const [openRefineMenu, setOpenRefineMenu] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState<Record<string, string>>({});
  const [customAIPrompt, setCustomAIPrompt] = useState("");
  
  const aiSlots = [
    {
      id: 'aesthetic',
      title: 'Aesthetic',
      icon: 'flare',
      color: 'text-primary',
      bgHover: 'hover:bg-primary',
      bgActive: 'bg-primary',
      textHover: 'group-hover:text-on-primary',
      subTextHover: 'group-hover:text-on-primary/70',
      vibes: ['Poetic', 'Cinematic', 'Raw'],
      desc: 'Calm, visual-heavy storytelling scripts.'
    },
    {
      id: 'funny',
      title: 'Funny / Meme',
      icon: 'sentiment_very_satisfied',
      color: 'text-secondary',
      bgHover: 'hover:bg-secondary',
      bgActive: 'bg-secondary',
      textHover: 'group-hover:text-on-secondary',
      subTextHover: 'group-hover:text-on-secondary/70',
      vibes: ['GenZ Brainrot', 'Sarcastic', 'Over-the-top'],
      desc: 'High engagement, relatable humor loops.'
    },
    {
      id: 'educational',
      title: 'Educational',
      icon: 'lightbulb',
      color: 'text-tertiary',
      bgHover: 'hover:bg-tertiary',
      bgActive: 'bg-tertiary',
      textHover: 'group-hover:text-on-tertiary',
      subTextHover: 'group-hover:text-on-tertiary/70',
      vibes: ['Step-by-step', 'Authoritative', 'Mind-blowing'],
      desc: 'Direct, informative, and authority-building.'
    },
  ];

  const submitRefinement = (slotId: string, instruction: string) => {
     onRefineScript(slotId, instruction);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">PRO STUDIO</h2>
      </div>

      {/* Custom AI Input */}
      <div className="glass-panel p-5 rounded-2xl shadow-sm border border-outline-variant/20 bg-surface-container-lowest">
        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">Your Custom Rules Input</label>
        <textarea 
          className="w-full bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none placeholder:text-outline/60 text-on-surface p-3" 
          placeholder="Enter custom instructions like tone, audience, or target topic..."
          value={customAIPrompt}
          onChange={(e) => setCustomAIPrompt(e.target.value)}
        />
        
        {scripts?.custom_ai ? (
          <div className="mt-4 flex gap-2">
            <button 
              className={`flex-1 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${activeScriptId === 'custom_ai' ? 'bg-primary text-on-primary ring-2 ring-primary/20' : 'bg-surface-container text-on-surface hover:bg-primary-container/50'}`}
              onClick={() => onSelectScript('custom_ai', scripts.custom_ai!)}
            >
              {activeScriptId === 'custom_ai' ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Active Mix</> : <><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span> Preview</>}
            </button>
            <button 
              className="px-4 bg-surface-container-highest text-primary py-2.5 rounded-xl font-semibold hover:bg-primary/10 transition-all flex items-center justify-center disabled:opacity-50"
              onClick={() => onGenerateCustomAI(customAIPrompt)}
              disabled={refiningSlot === 'custom_ai'}
            >
               <span className={`material-symbols-outlined text-[16px] ${refiningSlot === 'custom_ai' ? 'animate-spin' : ''}`}>autorenew</span>
            </button>
          </div>
        ) : (
          <button 
            className="w-full mt-4 bg-primary text-on-primary py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
            disabled={!customAIPrompt.trim() || refiningSlot === 'custom_ai'}
            onClick={() => onGenerateCustomAI(customAIPrompt)}
          >
            {refiningSlot === 'custom_ai' ? <><span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span> Generating...</> : "Generate with AI"}
          </button>
        )}
      </div>

      {/* Script Style Bento */}
      <div className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Script Templates</p>
        
        {aiSlots.map(slot => {
           const blocks = scripts ? scripts[slot.id] : null;
           const isActive = activeScriptId === slot.id;
           const isRefining = refiningSlot === slot.id;
           const isGenerating = analyzingSlot === slot.id;
           const isMenuOpen = openRefineMenu === slot.id;

           return (
             <div key={slot.id} className="flex flex-col gap-2">
               <div 
                 className={`group cursor-pointer p-4 rounded-2xl transition-all duration-300 relative overflow-hidden flex flex-col ${isActive && !isGenerating && !isRefining ? `${slot.bgActive} shadow-lg scale-[1.02]` : `bg-surface-container-lowest ${slot.bgHover} border border-outline-variant/10 shadow-[0_4px_12px_rgba(0,0,0,0.02)]`} ${isGenerating || isRefining ? 'opacity-70 scale-[0.98] pointer-events-none' : ''}`}
                 onClick={() => {
                   if (blocks) onSelectScript(slot.id, blocks);
                   else onGenerateScript(slot.id);
                 }}
               >
                 <div className="flex justify-between items-start mb-2 relative z-10">
                   <span className={`material-symbols-outlined transition-colors ${isActive ? (slot.id === 'aesthetic' ? 'text-on-primary' : slot.id === 'funny' ? 'text-on-secondary' : 'text-on-tertiary') : slot.color} ${slot.textHover}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                     {isGenerating || isRefining ? 'autorenew' : slot.icon}
                   </span>
                   {isGenerating || isRefining ? null : blocks ? (
                      isActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1"><span className="w-1 h-1 bg-white rounded-full animate-pulse" /> Active</span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface group-hover:bg-white/20 ${slot.textHover}`}>Drafted</span>
                      )
                   ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface group-hover:bg-white/20 ${slot.textHover}`}>Generate</span>
                   )}
                 </div>
                 <h3 className={`text-sm font-bold transition-colors relative z-10 ${isActive ? (slot.id === 'aesthetic' ? 'text-on-primary' : slot.id === 'funny' ? 'text-on-secondary' : 'text-on-tertiary') : 'text-on-surface'} ${slot.textHover}`}>{slot.title}</h3>
                 <p className={`text-xs transition-colors mt-1 relative z-10 ${isActive ? (slot.id === 'aesthetic' ? 'text-on-primary/80' : slot.id === 'funny' ? 'text-on-secondary/80' : 'text-on-tertiary/80') : 'text-on-surface-variant'} ${slot.subTextHover}`}>{slot.desc}</p>
                 <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-4 -mt-4 transition-transform group-hover:scale-150 ${slot.bgActive}`} />
               </div>

               {blocks && (
                 <div className="flex items-center justify-between px-2 text-xs">
                    <button 
                      className="text-primary font-semibold flex items-center gap-1 hover:text-primary-dim transition-colors"
                      onClick={() => setOpenRefineMenu(isMenuOpen ? null : slot.id)}
                    >
                       <span className="material-symbols-outlined text-[14px]">stream</span> {isMenuOpen ? "Close Remix" : "Remix Hook"}
                    </button>
                    {!isActive && (
                      <button 
                        className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                        onClick={() => onSelectScript(slot.id, blocks)}
                      >
                         <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span> Preview
                      </button>
                    )}
                 </div>
               )}

               {isMenuOpen && blocks && (
                 <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 flex flex-col gap-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Fast Remixes</p>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {slot.vibes.map(v => (
                         <button 
                           key={v}
                           className="bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface text-[10px] font-semibold px-2 py-1 rounded-md transition-colors"
                           onClick={() => submitRefinement(slot.id, `Make this script feel more ${v}`)}
                         >
                           {v}
                         </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                       <input 
                         className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant/30 rounded-md px-2.5 py-1.5 text-xs text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:border-primary/50"
                         placeholder="Or type custom rule..."
                         value={customInstructions[slot.id] || ''}
                         onChange={e => setCustomInstructions(prev => ({ ...prev, [slot.id]: e.target.value }))}
                       />
                       <button 
                         className="bg-primary text-on-primary px-3 rounded-md h-7 flex items-center justify-center disabled:opacity-50"
                         disabled={!customInstructions[slot.id] || isRefining}
                         onClick={() => submitRefinement(slot.id, customInstructions[slot.id])}
                       >
                         <span className="material-symbols-outlined text-[14px]">send</span>
                       </button>
                    </div>
                 </div>
               )}
             </div>
           );
        })}
      </div>
    </div>
  );
}
