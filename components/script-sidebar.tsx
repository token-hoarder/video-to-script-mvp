import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, User, Loader2, GraduationCap } from 'lucide-react';
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
}

export function ScriptSidebar({ scripts, isAnalyzing, onSelectScript, activeScriptId, customScriptBlocks }: ScriptSidebarProps) {
  const customSlot = { id: 'custom', title: 'Your Custom Script', icon: <User className="w-4 h-4 text-primary" /> };
  
  const aiSlots = [
    { id: 'aesthetic', title: 'Aesthetic Mode', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
    { id: 'funny', title: 'Funny / Meme Mode', icon: <Sparkles className="w-4 h-4 text-orange-400" /> },
    { id: 'educational', title: 'Educational Mode', icon: <GraduationCap className="w-4 h-4 text-blue-400" /> }
  ];

  return (
     <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2">
           <h3 className="text-lg font-semibold tracking-tight text-white/90">Script Selection</h3>
        </div>
        
        {/* Custom Script Slot */}
        <Card className={`border ${activeScriptId === 'custom' ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_15px_rgba(var(--primary),0.15)]' : 'border-zinc-800 bg-black/60'} transition-all hover:bg-zinc-900/80`}>
           <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800">
                    {customSlot.icon}
                 </div>
                 <span className="font-medium text-sm text-zinc-100">{customSlot.title}</span>
              </div>
              <Button 
                size="sm" 
                variant={activeScriptId === 'custom' ? 'default' : 'outline'} 
                className={`h-8 transition-colors ${activeScriptId !== 'custom' ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white' : ''}`}
                onClick={() => onSelectScript('custom', customScriptBlocks)}
              >
                 <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> 
                 {activeScriptId === 'custom' ? 'Previewing' : 'Preview'}
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
        <div className="flex flex-col gap-3">
          {isAnalyzing ? (
             <div className="flex flex-col items-center justify-center p-12 gap-5 border border-dashed border-zinc-800 rounded-xl bg-black/30 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-zinc-400 text-sm font-medium animate-pulse">Designing Narratives...</p>
             </div>
          ) : (
             aiSlots.map(slot => {
                const blocks = scripts ? scripts[slot.id] : null;
                const isActive = activeScriptId === slot.id;
                
                return (
                   <Card key={slot.id} className={`border ${isActive ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_15px_rgba(var(--primary),0.15)]' : 'border-zinc-800 bg-black/60'} transition-all ${!blocks ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : 'hover:bg-zinc-900/80'}`}>
                      <CardContent className="p-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 shadow-sm">
                               {slot.icon}
                            </div>
                            <span className="font-medium text-sm text-zinc-100">{slot.title}</span>
                         </div>
                         
                         {blocks ? (
                            <Button 
                              size="sm" 
                              variant={isActive ? 'default' : 'outline'} 
                              className={`h-8 transition-colors ${!isActive ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white' : ''}`}
                              onClick={() => onSelectScript(slot.id, blocks)}
                            >
                               <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> 
                               {isActive ? 'Previewing' : 'Preview'}
                            </Button>
                         ) : (
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-2.5 py-1 rounded bg-zinc-900/50 border border-zinc-800/50">Empty</span>
                         )}
                      </CardContent>
                   </Card>
                );
             })
          )}
        </div>
     </div>
  );
}
