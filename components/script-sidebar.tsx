import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, User, Loader2, GraduationCap, ChevronDown, Check, Send } from 'lucide-react';
import { useState } from 'react';

export type ScriptsPayload = {
  [key: string]: any[];
};

interface ScriptSidebarProps {
  scripts: ScriptsPayload | null;
  isAnalyzing: boolean;
  onSelectScript: (id: string, blocks: any[]) => void;
  activeScriptId: string | null;
  customScriptBlocks: any[];
  onRefineScript: (slotId: string, instruction: string) => void;
  onGenerateCustomAI: (prompt: string) => void;
  refiningSlot: string | null;
}

export function ScriptSidebar({ 
   scripts, 
   isAnalyzing, 
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
  const [customAIOpen, setCustomAIOpen] = useState(false);

  const customSlot = { id: 'custom', title: 'Your Custom Script', icon: <User className="w-4 h-4 text-primary" /> };
  
  const aiSlots = [
    { id: 'aesthetic', title: 'Aesthetic Mode', icon: <Sparkles className="w-4 h-4 text-purple-400" />, vibes: ['Poetic', 'Cinematic', 'Raw'] },
    { id: 'funny', title: 'Funny / Meme Mode', icon: <Sparkles className="w-4 h-4 text-orange-400" />, vibes: ['GenZ Brainrot', 'Sarcastic', 'Over-the-top'] },
    { id: 'educational', title: 'Educational Mode', icon: <GraduationCap className="w-4 h-4 text-blue-400" />, vibes: ['Step-by-step', 'Authoritative', 'Mind-blowing'] }
  ];

  const handleCustomInstructionChange = (id: string, val: string) => {
     setCustomInstructions(prev => ({ ...prev, [id]: val }));
  };

  const submitRefinement = (slotId: string, instruction: string) => {
     onRefineScript(slotId, instruction);
     // We can optionally keep the menu open so they see the spinner
  };

  return (
     <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2">
           <h3 className="text-lg font-semibold tracking-tight text-white/90">Script Selection</h3>
        </div>
        
        {/* Custom Script Slot */}
        <Card className={`border ${activeScriptId === 'custom' ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_15px_rgba(var(--primary),0.15)]' : 'border-zinc-800 bg-black/60'} transition-all hover:bg-zinc-900/80 overflow-hidden`}>
           <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                 <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 shrink-0">
                    {customSlot.icon}
                 </div>
                 <span className="font-medium text-sm text-zinc-100 truncate">{customSlot.title}</span>
              </div>
              <Button 
                size="sm" 
                variant={activeScriptId === 'custom' ? 'default' : 'outline'} 
                className={`h-8 px-3 shrink-0 transition-colors w-full sm:w-auto ${activeScriptId !== 'custom' ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white' : ''}`}
                onClick={() => onSelectScript('custom', customScriptBlocks)}
              >
                 <Play className={`w-3.5 h-3.5 mr-1.5 fill-current ${activeScriptId === 'custom' ? 'animate-pulse text-white' : ''}`} /> 
                 {activeScriptId === 'custom' ? 'Active' : 'Preview'}
              </Button>
           </CardContent>
        </Card>

        {/* Divider */}
        <div className="mt-4 mb-2 relative flex items-center">
            <div className="flex-grow border-t border-zinc-800/80"></div>
            <span className="shrink-0 mx-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Generated</span>
            <div className="flex-grow border-t border-zinc-800/80"></div>
        </div>
        
        {/* Generative Slots */}
        <div className="flex flex-col gap-3 min-w-0">
          {isAnalyzing && activeScriptId === null ? (
             <div className="flex flex-col items-center justify-center p-12 gap-5 border border-dashed border-zinc-800 rounded-xl bg-black/30 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-zinc-400 text-sm font-medium animate-pulse">Designing Narratives...</p>
             </div>
          ) : (
             <>
               {aiSlots.map(slot => {
                  const blocks = scripts ? scripts[slot.id] : null;
                  const isActive = activeScriptId === slot.id;
                  const isRefining = refiningSlot === slot.id;
                  const isMenuOpen = openRefineMenu === slot.id;
                  
                  return (
                     <div key={slot.id} className="flex flex-col gap-1.5 w-full min-w-0">
                        <Card className={`border ${isActive && !isRefining ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_15px_rgba(var(--primary),0.15)]' : 'border-zinc-800 bg-black/60'} transition-all overflow-hidden ${!blocks && !isAnalyzing ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : 'hover:bg-zinc-900/80'}`}>
                           <CardContent className="p-4 flex flex-col gap-3">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                                 <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 shadow-sm relative shrink-0">
                                       {isRefining ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : slot.icon}
                                    </div>
                                    <span className="font-medium text-sm text-zinc-100 truncate">{slot.title}</span>
                                 </div>
                                 
                                 {blocks ? (
                                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                       <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 px-2 text-zinc-400 hover:text-white shrink-0 flex-1 sm:flex-none"
                                          onClick={() => setOpenRefineMenu(isMenuOpen ? null : slot.id)}
                                          disabled={isRefining}
                                       >
                                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                                          Refine <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                                       </Button>
                                       <Button 
                                         size="sm" 
                                         variant={isActive ? 'default' : 'outline'} 
                                         className={`h-8 px-3 shrink-0 flex-1 sm:flex-none transition-colors ${!isActive ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white' : ''}`}
                                         onClick={() => onSelectScript(slot.id, blocks)}
                                       >
                                          <Play className={`w-3.5 h-3.5 mr-1.5 fill-current ${isActive ? 'animate-pulse text-white' : ''}`} /> 
                                          {isActive ? 'Active' : 'Preview'}
                                       </Button>
                                    </div>
                                 ) : (
                                    isAnalyzing ? (
                                       <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-2.5 py-1 rounded bg-zinc-900/50 border border-zinc-800/50 flex flex-row items-center gap-2 shrink-0"><Loader2 className="w-3 h-3 animate-spin"/> Generating</span>
                                    ) : (
                                       <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-2.5 py-1 rounded bg-zinc-900/50 border border-zinc-800/50 shrink-0">Empty</span>
                                    )
                                 )}
                              </div>

                              {/* Refinement Expansion Menu */}
                              {isMenuOpen && blocks && (
                                 <div className="pt-3 border-t border-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <p className="text-xs text-zinc-400 mb-2 font-medium tracking-wide">Quick Vibes</p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                       {slot.vibes.map(vibe => (
                                          <Button 
                                             key={vibe} 
                                             variant="outline" 
                                             size="sm" 
                                             className="h-7 text-xs bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full"
                                             onClick={() => submitRefinement(slot.id, `Make this script feel more ${vibe}`)}
                                          >
                                             {vibe}
                                          </Button>
                                       ))}
                                    </div>
                                    <p className="text-xs text-zinc-400 mb-2 font-medium tracking-wide mt-1">Custom Instruction</p>
                                    <div className="flex items-center gap-2">
                                       <input
                                          className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-primary/50"
                                          placeholder="e.g. Make it more about the sunset..."
                                          value={customInstructions[slot.id] || ''}
                                          onChange={e => handleCustomInstructionChange(slot.id, e.target.value)}
                                          onKeyDown={e => {
                                             if (e.key === 'Enter' && customInstructions[slot.id]) {
                                                submitRefinement(slot.id, customInstructions[slot.id]);
                                             }
                                          }}
                                       />
                                       <Button 
                                          size="sm" 
                                          className="h-[34px] w-[34px] p-0 bg-primary shrink-0 text-white hover:bg-primary/90"
                                          disabled={!customInstructions[slot.id] || isRefining}
                                          onClick={() => submitRefinement(slot.id, customInstructions[slot.id])}
                                       >
                                          <Send className="w-3.5 h-3.5" />
                                       </Button>
                                    </div>
                                 </div>
                              )}
                           </CardContent>
                        </Card>
                     </div>
                  );
               })}

               {/* Custom AI Prompt Slot */}
               <Card className={`border w-full flex-1 min-w-0 ${activeScriptId === 'custom_ai' ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_15px_rgba(var(--primary),0.15)]' : 'border-zinc-800 bg-black/60'} transition-all mt-2 overflow-hidden`}>
                  <CardContent className="p-4 flex flex-col gap-3 min-w-0">
                     <div className="flex items-center justify-between cursor-pointer min-w-0 gap-3" onClick={() => setCustomAIOpen(!customAIOpen)}>
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 shadow-sm shrink-0">
                              <Sparkles className="w-4 h-4 text-emerald-400" />
                           </div>
                           <span className="font-medium text-sm text-zinc-100 truncate">Custom AI Prompt</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${customAIOpen ? 'rotate-180' : ''}`} />
                     </div>
                     
                     {customAIOpen && (
                        <div className="pt-3 border-t border-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-3 min-w-0">
                           <textarea
                              className="w-full bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 rounded-md p-3 min-h-[100px] focus:outline-none focus:border-primary/50 resize-none custom-scrollbar"
                              placeholder="Write a completely custom prompt..."
                              value={customAIPrompt}
                              onChange={e => setCustomAIPrompt(e.target.value)}
                           />
                           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
                              <span className="text-[10px] text-zinc-500 font-mono shrink-0">Will perfectly fit video duration</span>
                              <Button 
                                 size="sm" 
                                 className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white px-4 shrink-0 w-full sm:w-auto"
                                 disabled={!customAIPrompt.trim() || refiningSlot === 'custom_ai'}
                                 onClick={() => onGenerateCustomAI(customAIPrompt)}
                              >
                                 {refiningSlot === 'custom_ai' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                                 {refiningSlot === 'custom_ai' ? 'Generating...' : 'Generate New Script'}
                              </Button>
                           </div>
                           {scripts?.custom_ai && (
                              <div className="pt-2 w-full min-w-0">
                                 <Button 
                                    size="sm" 
                                    variant={activeScriptId === 'custom_ai' ? 'default' : 'outline'} 
                                    className={`w-full h-8 px-3 shrink-0 transition-colors ${activeScriptId !== 'custom_ai' ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white' : ''}`}
                                    onClick={() => onSelectScript('custom_ai', scripts.custom_ai)}
                                 >
                                    <Play className={`w-3.5 h-3.5 mr-1.5 fill-current ${activeScriptId === 'custom_ai' ? 'animate-pulse text-white' : ''}`} /> 
                                    {activeScriptId === 'custom_ai' ? 'Active Custom Mix' : 'Preview Custom Mix'}
                                 </Button>
                              </div>
                           )}
                        </div>
                     )}
                  </CardContent>
               </Card>
             </>
          )}
        </div>
     </div>
  );
}
