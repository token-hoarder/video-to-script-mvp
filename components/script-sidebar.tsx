import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, User, Loader2, GraduationCap, ChevronDown, Send, Laugh, Palette } from 'lucide-react';
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
  const [customAIOpen, setCustomAIOpen] = useState(false);

  const aiSlots = [
    {
      id: 'aesthetic',
      title: 'Aesthetic',
      icon: <Palette className="w-4 h-4" />,
      color: 'text-purple-400',
      vibes: ['Poetic', 'Cinematic', 'Raw'],
    },
    {
      id: 'funny',
      title: 'Funny / Meme',
      icon: <Laugh className="w-4 h-4" />,
      color: 'text-orange-400',
      vibes: ['GenZ Brainrot', 'Sarcastic', 'Over-the-top'],
    },
    {
      id: 'educational',
      title: 'Educational',
      icon: <GraduationCap className="w-4 h-4" />,
      color: 'text-blue-400',
      vibes: ['Step-by-step', 'Authoritative', 'Mind-blowing'],
    },
  ];

  const submitRefinement = (slotId: string, instruction: string) => {
     onRefineScript(slotId, instruction);
  };

  // ── Active indicator dot ──────────────────────────────────────────────────
  function ActiveDot() {
    return (
      <div className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
      </div>
    );
  }

  return (
     <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-1">
           <h3 className="text-sm font-bold tracking-tight uppercase text-muted-foreground/70 text-xs">Pro Studio</h3>
        </div>
        
        {/* ── Custom Script Slot (compact row) ─────────────────────────── */}
        <div className={`rounded-xl border transition-all overflow-hidden ${activeScriptId === 'custom' ? 'border-primary/60 bg-primary/5' : 'border-border bg-card hover:border-border/80'}`}>
           <div className="flex items-center justify-between px-3 py-2.5 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                 <div className={`shrink-0 p-1.5 rounded-lg ${activeScriptId === 'custom' ? 'bg-primary/20' : 'bg-muted'}`}>
                    <User className={`w-3.5 h-3.5 ${activeScriptId === 'custom' ? 'text-primary' : 'text-muted-foreground'}`} />
                 </div>
                 <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-none truncate">Your Custom Script</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Your draft inputs</p>
                 </div>
              </div>
              <Button
                 size="sm"
                 variant={activeScriptId === 'custom' ? 'default' : 'secondary'}
                 className="h-7 px-2.5 text-xs shrink-0"
                 onClick={() => onSelectScript('custom', customScriptBlocks)}
              >
                 {activeScriptId === 'custom' ? (
                    <span className="flex items-center gap-1.5"><ActiveDot />Active</span>
                 ) : (
                    <span className="flex items-center gap-1"><Play className="w-3 h-3 fill-current" />Preview</span>
                 )}
              </Button>
           </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="relative flex items-center my-0.5">
            <div className="flex-grow border-t border-border" />
            <span className="shrink-0 mx-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">AI Generated</span>
            <div className="flex-grow border-t border-border" />
        </div>
        
        {/* ── AI Slots (compact rows) ──────────────────────────────────── */}
        <div className="flex flex-col gap-2">
           {aiSlots.map(slot => {
             const blocks = scripts ? scripts[slot.id] : null;
             const isActive = activeScriptId === slot.id;
             const isRefining = refiningSlot === slot.id;
             const isGenerating = analyzingSlot === slot.id;
             const isMenuOpen = openRefineMenu === slot.id;
             
             return (
                <div
                   key={slot.id}
                   className={`rounded-xl border transition-all overflow-hidden ${isActive && !isRefining ? 'border-primary/60 bg-primary/5' : 'border-border bg-card hover:border-border/80'} ${!blocks && !isGenerating ? 'opacity-80 hover:opacity-100' : ''}`}
                >
                   {/* Compact header row */}
                   <div className="flex items-center justify-between px-3 py-2.5 gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                         <div className={`shrink-0 p-1.5 rounded-lg ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                            {isRefining || isGenerating
                               ? <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                               : <span className={slot.color}>{slot.icon}</span>
                            }
                         </div>
                         <p className="text-sm font-semibold text-foreground truncate">{slot.title}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                         {blocks && (
                            <button
                               className={`flex items-center text-[10px] text-muted-foreground hover:text-foreground transition-colors gap-1 px-1.5 py-1 rounded-md hover:bg-muted ${isMenuOpen ? 'bg-muted' : ''}`}
                               onClick={() => setOpenRefineMenu(isMenuOpen ? null : slot.id)}
                               disabled={isRefining}
                               title="Refine output"
                            >
                               <Sparkles className="w-3 h-3" />
                               <ChevronDown className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                         )}
                         <Button
                            size="sm"
                            variant={isActive ? 'default' : 'secondary'}
                            className="h-7 px-2.5 text-xs"
                            onClick={() => blocks ? onSelectScript(slot.id, blocks) : onGenerateScript(slot.id)}
                            disabled={isGenerating && !blocks}
                         >
                            {isGenerating && !blocks ? (
                               <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Drafting</span>
                            ) : isActive ? (
                               <span className="flex items-center gap-1.5"><ActiveDot />Active</span>
                            ) : blocks ? (
                               <span className="flex items-center gap-1"><Play className="w-3 h-3 fill-current" />Preview</span>
                            ) : (
                               <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />Generate</span>
                            )}
                         </Button>
                      </div>
                   </div>

                   {/* Refine expansion panel */}
                   {isMenuOpen && blocks && (
                      <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-150">
                         <div className="bg-muted/50 rounded-lg p-2.5 border border-border/50">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-2">Quick Vibes</p>
                            <div className="flex flex-wrap gap-1 mb-2.5">
                               {slot.vibes.map(vibe => (
                                  <Button
                                     key={vibe}
                                     variant="secondary"
                                     size="sm"
                                     className="h-6 px-2 text-[10px]"
                                     onClick={() => submitRefinement(slot.id, `Make this script feel more ${vibe}`)}
                                  >
                                     {vibe}
                                  </Button>
                               ))}
                            </div>
                            <div className="flex gap-1.5">
                               <input
                                  className="flex-1 min-w-0 bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                  placeholder="Custom instruction…"
                                  value={customInstructions[slot.id] || ''}
                                  onChange={e => setCustomInstructions(prev => ({ ...prev, [slot.id]: e.target.value }))}
                                  onKeyDown={e => {
                                     if (e.key === 'Enter' && customInstructions[slot.id]) {
                                        submitRefinement(slot.id, customInstructions[slot.id]);
                                     }
                                  }}
                               />
                               <Button
                                  size="sm"
                                  className="h-7 px-2.5 shrink-0"
                                  disabled={!customInstructions[slot.id] || isRefining}
                                  onClick={() => submitRefinement(slot.id, customInstructions[slot.id])}
                               >
                                  <Send className="w-3 h-3" />
                               </Button>
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             );
           })}

           {/* ── Custom AI Builder (compact row + expandable) ────────── */}
           <div className={`rounded-xl border transition-all overflow-hidden ${activeScriptId === 'custom_ai' ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-border bg-card hover:border-emerald-800/40'}`}>
              <div className="flex items-center justify-between px-3 py-2.5 gap-3">
                 <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`shrink-0 p-1.5 rounded-lg ${activeScriptId === 'custom_ai' ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                       <Sparkles className={`w-3.5 h-3.5 ${activeScriptId === 'custom_ai' ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">Custom AI Builder</p>
                 </div>
                 <button
                    className={`flex items-center text-[10px] text-emerald-500/80 hover:text-emerald-400 transition-colors gap-1 px-1.5 py-1 rounded-md hover:bg-emerald-950/30 ${customAIOpen ? 'bg-emerald-950/30' : ''}`}
                    onClick={() => setCustomAIOpen(!customAIOpen)}
                 >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${customAIOpen ? 'rotate-180' : ''}`} />
                 </button>
              </div>

              {/* Custom AI expansion */}
              {customAIOpen && (
                 <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-muted/50 rounded-lg p-2.5 border border-border/50 flex flex-col gap-2">
                       <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Custom Prompt</p>
                       <textarea
                          className="w-full bg-background border border-border text-xs text-foreground rounded-md p-2.5 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none placeholder:text-muted-foreground/50"
                          placeholder="Give the AI completely custom instructions for tone, style, or topic…"
                          value={customAIPrompt}
                          onChange={e => setCustomAIPrompt(e.target.value)}
                       />
                       <Button
                          size="sm"
                          className="w-full h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                          disabled={!customAIPrompt.trim() || refiningSlot === 'custom_ai'}
                          onClick={() => onGenerateCustomAI(customAIPrompt)}
                       >
                          {refiningSlot === 'custom_ai'
                             ? <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Generating…</>
                             : <><Sparkles className="w-3 h-3 mr-1.5" />Generate Custom Script</>
                          }
                       </Button>
                    </div>
                 </div>
              )}

              {/* Preview button if custom_ai result exists */}
              {scripts?.custom_ai && (
                 <div className="px-3 pb-2.5 border-t border-border/50 pt-2">
                    <Button
                       size="sm"
                       variant={activeScriptId === 'custom_ai' ? 'default' : 'secondary'}
                       className="w-full h-7 text-xs"
                       onClick={() => onSelectScript('custom_ai', scripts.custom_ai)}
                    >
                       {activeScriptId === 'custom_ai'
                          ? <span className="flex items-center gap-1.5"><ActiveDot />Active Output</span>
                          : <span className="flex items-center gap-1"><Play className="w-3 h-3 fill-current" />Preview Custom Mix</span>
                       }
                    </Button>
                 </div>
              )}
           </div>
        </div>
     </div>
  );
}
