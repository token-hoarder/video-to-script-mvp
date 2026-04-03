import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, User, Loader2, GraduationCap, ChevronDown, Check, Send } from 'lucide-react';
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
     <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-2">
           <h3 className="text-xl font-bold tracking-tight text-white">Pro Studio</h3>
        </div>
        
        {/* Custom Script Slot */}
        <Card className={`border-2 transition-all overflow-hidden ${activeScriptId === 'custom' ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.2)]' : 'border-zinc-800 bg-secondary/50 hover:bg-secondary/40'}`}>
           <CardContent className="p-4 flex flex-col items-center">
              <div className="flex flex-col items-center gap-2 mb-4">
                 <div className="p-3 rounded-full bg-zinc-900 border border-zinc-700 shadow-xl relative shrink-0">
                    {customSlot.icon}
                 </div>
                 <span className="font-semibold text-lg text-zinc-100 text-center text-balance">
                    {customSlot.title}
                 </span>
                 <span className="text-xs text-muted-foreground text-center">
                     Your draft inputs
                 </span>
              </div>
              <div className="w-full mt-1">
                 <Button 
                   size="sm" 
                   variant={activeScriptId === 'custom' ? 'default' : 'secondary'} 
                   className="w-full h-9 font-medium"
                   onClick={() => onSelectScript('custom', customScriptBlocks)}
                 >
                    {activeScriptId === 'custom' ? (
                       <div className="flex items-center">
                          <div className="relative flex h-2 w-2 mr-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
                          </div>
                          <span>Active</span>
                       </div>
                    ) : (
                       <div className="flex items-center">
                          <Play className="w-3.5 h-3.5 mr-2 fill-current" /> 
                          <span>Preview Draft</span>
                       </div>
                    )}
                 </Button>
              </div>
           </CardContent>
        </Card>

        {/* Divider */}
        <div className="mt-4 mb-2 relative flex items-center">
            <div className="flex-grow border-t border-zinc-800/80"></div>
            <span className="shrink-0 mx-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Generated</span>
            <div className="flex-grow border-t border-zinc-800/80"></div>
        </div>
        
        {/* Generative Slots */}
        <div className="flex flex-col gap-4">
             <>
                {aiSlots.map(slot => {
                  const blocks = scripts ? scripts[slot.id] : null;
                  const isActive = activeScriptId === slot.id;
                  const isRefining = refiningSlot === slot.id;
                  const isGenerating = analyzingSlot === slot.id;
                  const isMenuOpen = openRefineMenu === slot.id;
                  
                  return (
                     <Card 
                        key={slot.id} 
                        className={`transition-all overflow-hidden border-2 flex flex-col ${isActive && !isRefining ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.2)]' : 'border-zinc-800 bg-secondary/50 hover:bg-secondary/40'} ${!blocks && !isGenerating ? 'opacity-80 hover:opacity-100' : ''}`}
                     >
                        <CardContent className="p-4 flex flex-col items-center">
                           {/* Top Row: Icon and Title */}
                           <div className="flex flex-col items-center gap-2 mb-3">
                              <div className="p-3 rounded-full bg-zinc-900 border border-zinc-700 shadow-xl relative shrink-0">
                                 {isRefining || isGenerating ? <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" /> : slot.icon}
                              </div>
                              <span className="font-semibold text-base text-zinc-100 text-center text-balance">
                                 {slot.title}
                              </span>
                           </div>

                           {/* Middle Row: Refine Trigger */}
                           {blocks && (
                              <div className="w-full border-t border-zinc-800/80 pt-3 pb-3 flex flex-col items-center gap-3">
                                 <button
                                    className="flex items-center text-xs text-muted-foreground hover:text-white transition-colors"
                                    onClick={() => setOpenRefineMenu(isMenuOpen ? null : slot.id)}
                                    disabled={isRefining}
                                 >
                                    <Sparkles className="w-3 h-3 mr-1.5 text-zinc-400" />
                                    {isMenuOpen ? 'Close Menu' : 'Refine Output'}
                                    <ChevronDown className={`w-3 h-3 ml-1.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                                 </button>

                                 {/* Expansion Menu */}
                                 {isMenuOpen && (
                                    <div className="w-full animate-in fade-in slide-in-from-top-2 duration-200 bg-black/20 rounded-lg p-3 border border-zinc-800/50 mt-1">
                                       <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold text-left">Quick Vibes</p>
                                       <div className="flex flex-wrap gap-1.5 mb-3">
                                          {slot.vibes.map(vibe => (
                                             <Button 
                                                key={vibe} 
                                                variant="secondary" 
                                                size="sm" 
                                                className="h-6 px-2 text-[10px] text-zinc-300 hover:text-white border border-zinc-800"
                                                onClick={() => submitRefinement(slot.id, `Make this script feel more ${vibe}`)}
                                             >
                                                {vibe}
                                             </Button>
                                          ))}
                                       </div>
                                       <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold mt-1 text-left">Custom Instruction</p>
                                       <div className="flex flex-col gap-2">
                                          <input
                                             className="w-full bg-black/40 border border-zinc-800 text-sm text-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:border-primary/50 placeholder:text-zinc-600"
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
                                             className="w-full h-8 bg-zinc-200 text-zinc-900 hover:bg-white"
                                             disabled={!customInstructions[slot.id] || isRefining}
                                             onClick={() => submitRefinement(slot.id, customInstructions[slot.id])}
                                          >
                                             Send Instruction <Send className="w-3 h-3 ml-1.5" />
                                          </Button>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           )}
                           
                           {/* Bottom Row: Preview/Active Button */}
                           {blocks ? (
                              <div className="w-full mt-1">
                                 <Button 
                                   size="sm" 
                                   variant={isActive ? 'default' : 'secondary'} 
                                   className="w-full h-9 font-medium"
                                   onClick={() => onSelectScript(slot.id, blocks)}
                                 >
                                    {isActive ? (
                                       <div className="flex items-center">
                                          <div className="relative flex h-2 w-2 mr-2">
                                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                             <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
                                          </div>
                                          <span>Active</span>
                                       </div>
                                    ) : (
                                       <div className="flex items-center">
                                          <Play className="w-3.5 h-3.5 mr-2 fill-current" /> 
                                          <span>Preview {slot.title}</span>
                                       </div>
                                    )}
                                 </Button>
                              </div>
                           ) : (
                              <div className="w-full pt-3 border-t border-zinc-800/80 mt-1">
                                 <Button 
                                   size="sm" 
                                   variant="secondary" 
                                   className="w-full h-9 font-medium border border-zinc-700/50 bg-black/40 hover:bg-white/10 text-zinc-300 transition-colors"
                                   onClick={() => onGenerateScript(slot.id)}
                                   disabled={analyzingSlot !== null}
                                 >
                                    {isGenerating ? (
                                       <div className="flex items-center">
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
                                          <span className="text-primary font-semibold tracking-wide">Drafting...</span>
                                       </div>
                                    ) : (
                                       <div className="flex items-center">
                                          <Sparkles className="w-3.5 h-3.5 mr-2" />
                                          <span>Generate Draft</span>
                                       </div>
                                    )}
                                 </Button>
                              </div>
                           )}
                        </CardContent>
                     </Card>
                  );
               })}

               {/* Custom AI Prompt Slot */}
               <Card className={`border-2 transition-all mt-4 overflow-hidden ${activeScriptId === 'custom_ai' ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.2)]' : 'border-zinc-800 bg-secondary/50 hover:bg-secondary/40'}`}>
                  <CardContent className="p-4 flex flex-col items-center">
                     <div className="flex flex-col items-center gap-2 mb-3">
                        <div className="p-3 rounded-full bg-zinc-900 border border-zinc-700 shadow-xl relative shrink-0">
                           <Sparkles className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="font-semibold text-base text-zinc-100 text-center text-balance">
                           Custom AI Builder
                        </span>
                     </div>
                     <div className="w-full border-t border-zinc-800/80 pt-3 pb-2 flex flex-col items-center gap-3">
                        <button
                           className="flex items-center text-xs text-emerald-500/80 hover:text-emerald-400 transition-colors"
                           onClick={() => setCustomAIOpen(!customAIOpen)}
                        >
                           <Sparkles className="w-3 h-3 mr-1.5" />
                           {customAIOpen ? 'Close Workspace' : 'Open Workspace'}
                           <ChevronDown className={`w-3 h-3 ml-1.5 transition-transform ${customAIOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Expansion Menu */}
                        {customAIOpen && (
                           <div className="w-full animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-3 mt-1 bg-black/20 rounded-lg p-3 border border-zinc-800/50">
                              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">Custom Prompt</p>
                              <textarea
                                 className="w-full bg-black/40 border border-zinc-800 text-sm text-zinc-200 rounded-md p-3 min-h-[100px] focus:outline-none focus:border-emerald-500/50 resize-none custom-scrollbar placeholder:text-zinc-600"
                                 placeholder="Provide a completely unhinged or specific instruction for the style..."
                                 value={customAIPrompt}
                                 onChange={e => setCustomAIPrompt(e.target.value)}
                              />
                              <Button 
                                 size="sm" 
                                 className="w-full h-9 bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-lg"
                                 disabled={!customAIPrompt.trim() || refiningSlot === 'custom_ai'}
                                 onClick={() => onGenerateCustomAI(customAIPrompt)}
                              >
                                 {refiningSlot === 'custom_ai' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                                 {refiningSlot === 'custom_ai' ? 'Generating Script...' : 'Generate New Array'}
                              </Button>
                           </div>
                        )}
                     </div>

                     {scripts?.custom_ai && (
                        <div className="w-full mt-2 pt-3 border-t border-zinc-800/80">
                           <Button 
                              size="sm" 
                              variant={activeScriptId === 'custom_ai' ? 'default' : 'secondary'} 
                              className="w-full h-9 font-medium"
                              onClick={() => onSelectScript('custom_ai', scripts.custom_ai)}
                           >
                              {activeScriptId === 'custom_ai' ? (
                                 <div className="flex items-center">
                                    <div className="relative flex h-2 w-2 mr-2">
                                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                       <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
                                    </div>
                                    <span>Active Output</span>
                                 </div>
                              ) : (
                                 <div className="flex items-center">
                                    <Play className="w-3.5 h-3.5 mr-2 fill-current" /> 
                                    <span>Preview Custom Mix</span>
                                 </div>
                              )}
                           </Button>
                        </div>
                     )}
                  </CardContent>
               </Card>
            </>
        </div>
     </div>
  );
}
