'use client';
import { useEffect,useRef,useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { useGuestAuth,publishCredits } from '@/hooks/useGuestAuth';
import { createClient } from '@/utils/supabase/client';
import { MAX_VIDEO_BYTES,MAX_VIDEO_SECONDS,validateBlocks,type TextBlock,type TextStyle,type TextPosition } from '@/lib/reel';
import { textCardCanvas } from '@/lib/render-text';
import { exportReel } from '@/lib/export-reel';
const button='min-h-11 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary disabled:opacity-50';
const field='w-full min-h-11 rounded-xl border border-outline-variant/30 bg-background px-3 py-2 text-base';
function download(blob:Blob,name:string) {const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export default function StudioPage() {
  const {user,credits,isLoading,authError,refreshCredits,upgradeToGoogle}=useGuestAuth();
  const [supabase]=useState(()=>createClient());
  const [file,setFile]=useState<File|null>(null),[url,setUrl]=useState('');
  const [message,setMessage]=useState(''),[language,setLanguage]=useState('English'),[tone,setTone]=useState('Warm');
  const [blocks,setBlocks]=useState<TextBlock[]>([]),[duration,setDuration]=useState(0),[size,setSize]=useState({width:720,height:1280});
  const [style,setStyle]=useState<TextStyle>('clean'),[position,setPosition]=useState<TextPosition>('bottom');
  const [time,setTime]=useState(0),[busy,setBusy]=useState(false),[exporting,setExporting]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(''),[exported,setExported]=useState<Blob|null>(null);
  const video=useRef<HTMLVideoElement>(null),input=useRef<HTMLInputElement>(null),overlay=useRef<HTMLCanvasElement>(null),abort=useRef<AbortController|null>(null);
  const active=blocks.find(block=>time>=block.startTime&&time<block.endTime);
  useEffect(()=>()=>{if(url)URL.revokeObjectURL(url);},[url]);
  useEffect(()=>()=>abort.current?.abort(),[]);
  useEffect(()=>{const target=overlay.current;if(!target)return; target.width=size.width;target.height=size.height;const ctx=target.getContext('2d');ctx?.clearRect(0,0,size.width,size.height);if(active)ctx?.drawImage(textCardCanvas(active.text,size.width,size.height,{style,position}),0,0);},[active,size,style,position]);
  const select=(selected:File)=>{
    setError('');
    if(selected.size>MAX_VIDEO_BYTES||! /\.(mp4|mov)$/i.test(selected.name)){setError('Choose an MP4 or MOV under 30 MB.');return;}
    setFile(selected);setUrl(URL.createObjectURL(selected));setDuration(0);setBlocks([]);setExported(null);setTime(0);setStatus('');
  };
  const generate=async()=>{
    if(!file||!user)return;
    setBusy(true);setError('');setExported(null);abort.current=new AbortController();
    const timeout=setTimeout(()=>abort.current?.abort(),90000);let uploadPath:string|undefined;
    try {
      setStatus('Uploading privately…');
      const ext=file.name.toLowerCase().endsWith('.mov')?'mov':'mp4';
      uploadPath=`${user.id}/${crypto.randomUUID()}.${ext}`;
      const signed=await fetch('/api/upload-url',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filePath:uploadPath}),signal:abort.current.signal});
      const upload=await signed.json();if(!signed.ok)throw new Error(upload.error);
      const uploaded=await fetch(upload.signedUrl,{method:'PUT',headers:{'Content-Type':ext==='mov'?'video/quicktime':'video/mp4','Authorization':`Bearer ${upload.token}`},body:file,signal:abort.current.signal});
      if(!uploaded.ok)throw new Error('Upload failed. Check your connection and try again.');
      setStatus('Watching your footage and writing text…');
      const response=await fetch('/api/generate-script',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({videoPath:uploadPath,message,language,tone}),signal:abort.current.signal});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setBlocks(validateBlocks(result.blocks,result.duration));publishCredits(result.creditsRemaining);
      setTime(0);if(video.current){video.current.currentTime=0;video.current.pause();}
      setStatus('Your text is ready. Review it, then download your reel.');
    } catch(e) {setError((e as Error).name==='AbortError'?'Analysis cancelled or timed out. Refresh after three minutes to recover any unfinished reservation.':(e as Error).message);setStatus('');}
    finally {clearTimeout(timeout);setBusy(false);if(uploadPath)await supabase.storage.from('videos').remove([uploadPath]);void refreshCredits().catch(()=>{});}
  };
  const update=(index:number,key:'text'|'startTime'|'endTime',value:string)=>{setExported(null);setBlocks(current=>current.map((block,i)=>i===index?{...block,[key]:key==='text'?value:Number(value)}:block));};
  const exportVideo=async()=>{
    if(!file)return;setExporting(true);setError('');abort.current=new AbortController();
    try {const blob=await exportReel(file,blocks,duration,size.width,size.height,{style,position},setStatus,abort.current.signal);setExported(blob);download(blob,'viralscript-reel.mp4');setStatus('Your MP4 is ready. Download it or share it below.');}
    catch(e){setError(abort.current.signal.aborted?'Export cancelled.':(e as Error).message);setStatus('');}
    finally{setExporting(false);}
  };
  const share=async()=>{
    if(!exported)return;const reel=new File([exported],'viralscript-reel.mp4',{type:'video/mp4'});
    if(navigator.canShare?.({files:[reel]})){try{await navigator.share({files:[reel]});}catch(e){if((e as Error).name!=='AbortError')setError('Sharing failed. Use Download MP4 instead.');}}
    else download(exported,'viralscript-reel.mp4');
  };
  let validation='';if(blocks.length)try{validateBlocks(blocks,duration);}catch(e){validation=(e as Error).message;}
  const locked=busy||exporting;
  return <div className="min-h-screen bg-background text-on-surface"><AppHeader/><main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
    <div className="mb-7"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Your footage. Your story.</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Make it work on mute.</h1><p className="mt-3 max-w-xl text-on-surface-variant">Turn your footage and message into a reel with readable, timed text. Keep your original video and sound.</p></div>
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
    <section className="min-w-0 space-y-4" aria-label="Video preview">
      <input ref={input} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" className="sr-only" aria-label="Choose video" onChange={e=>{const selected=e.target.files?.[0];if(selected)select(selected);e.target.value='';}}/>
      {!file?<button className="flex min-h-64 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/30 bg-surface-container-low p-8 text-center" onClick={()=>input.current?.click()}><span className="mb-4 text-4xl" aria-hidden>↥</span><span className="text-xl font-semibold">Choose your footage</span><span className="mt-2 text-sm text-on-surface-variant">MP4 or MOV · up to 60 seconds · 30 MB</span></button>:<>
        <div className="mx-auto relative overflow-hidden rounded-2xl bg-black" style={{aspectRatio:`${size.width}/${size.height}`,maxWidth:size.height>size.width?`min(100%, 340px, ${65*size.width/size.height}vh)`:'100%'}}>
          <video ref={video} src={url || undefined} playsInline controls preload="metadata" className="h-full w-full" onLoadedMetadata={e=>{const v=e.currentTarget;if(!Number.isFinite(v.duration)||v.duration<2||v.duration>MAX_VIDEO_SECONDS){setError('Choose a video between 2 and 60 seconds long.');setDuration(0);return;}setDuration(v.duration);setSize({width:v.videoWidth,height:v.videoHeight});}} onError={()=>setError('This video cannot play in your browser. Try an H.264 MP4.')} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onSeeked={e=>setTime(e.currentTarget.currentTime)} />
          <canvas ref={overlay} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full"/>
        </div>
        <div className="flex items-center justify-between gap-3"><p className="min-w-0 truncate text-sm text-on-surface-variant">{file.name}</p><button disabled={locked} className="min-h-11 shrink-0 rounded-xl border border-outline-variant/30 px-4 text-sm" onClick={()=>input.current?.click()}>Change video</button></div>
      </>}
      <p className="text-xs leading-relaxed text-on-surface-variant">Analysis uploads your clip privately to Supabase and Google Gemini. Temporary uploads are removed after the request. MP4 export happens on your device.</p>
    </section>
    <section className="min-w-0 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 sm:p-6" aria-label="Story editor">
      <label htmlFor="story" className="font-semibold">What do you want this video to say?</label>
      <p className="mb-3 mt-1 text-sm text-on-surface-variant">Share the message and any true facts. For example: “I packed my first order today. Make it feel hopeful.”</p>
      <textarea id="story" className={field+' min-h-28 resize-y'} maxLength={1500} value={message} onChange={e=>setMessage(e.target.value)} disabled={locked} placeholder="Describe your story…"/>
      <div className="my-4 grid grid-cols-2 gap-3"><label className="text-sm">Language<select className={field+' mt-1'} value={language} onChange={e=>setLanguage(e.target.value)} disabled={locked}>{['English','Hindi','Hinglish'].map(x=><option key={x}>{x}</option>)}</select></label><label className="text-sm">Tone<select className={field+' mt-1'} value={tone} onChange={e=>setTone(e.target.value)} disabled={locked}>{['Warm','Playful','Informative'].map(x=><option key={x}>{x}</option>)}</select></label></div>
      <button className={button+' w-full'} onClick={credits===0?upgradeToGoogle:generate} disabled={locked||isLoading||!user||!file||!duration||!message.trim()}>{busy?'Creating text…':credits===0?'Sign in to continue':blocks.length?'Generate another draft':'Create my story text'}</button>
      <p className="mt-2 text-xs text-on-surface-variant">One analysis per draft. Editing and video export use no extra credits.</p>
      {(error||authError)&&<p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error||authError}</p>}
      {status&&<p role="status" className="mt-4 text-sm text-on-surface-variant">{status}</p>}
      {locked&&<button className="mt-2 min-h-11 text-sm underline" onClick={()=>abort.current?.abort()}>Cancel {exporting?'export':'analysis'}</button>}
      {!!blocks.length&&<div className="mt-6 border-t border-outline-variant/20 pt-5"><h2 className="text-lg font-semibold">Make it yours</h2><p className="mt-1 text-sm text-on-surface-variant">Tap a time to preview. Keep cards short and give them room to breathe.</p>
      <div className="my-4 grid grid-cols-2 gap-3"><label className="text-sm">Text style<select className={field+' mt-1'} value={style} disabled={locked} onChange={e=>{setStyle(e.target.value as TextStyle);setExported(null);}}><option value="clean">Clean</option><option value="bold">Bold</option><option value="label">Warm label</option></select></label><label className="text-sm">Placement<select className={field+' mt-1'} value={position} disabled={locked} onChange={e=>{setPosition(e.target.value as TextPosition);setExported(null);}}>{['top','middle','bottom'].map(x=><option key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</option>)}</select></label></div>
      <ol className="space-y-4">{blocks.map((block,index)=><li key={index} className="rounded-xl bg-surface-container-low p-3"><div className="mb-2 flex items-center justify-between"><button className="min-h-11 text-sm font-semibold text-primary" onClick={()=>{if(video.current){video.current.currentTime=block.startTime;video.current.pause();setTime(block.startTime);}}}>Card {index+1} · Preview</button><button className="min-h-11 px-2 text-xs underline" disabled={locked} onClick={()=>{setBlocks(current=>current.filter((_,i)=>i!==index));setExported(null);}}>Remove</button></div><label className="sr-only" htmlFor={`card-${index}`}>Card {index+1} text</label><textarea id={`card-${index}`} className={field+' min-h-20'} value={block.text} maxLength={100} disabled={locked} onChange={e=>update(index,'text',e.target.value)}/><div className="mt-2 grid grid-cols-2 gap-3"><label className="text-xs">Start (seconds)<input type="number" min="0" max={duration} step="0.1" className={field+' mt-1'} value={block.startTime} disabled={locked} onChange={e=>update(index,'startTime',e.target.value)}/></label><label className="text-xs">End (seconds)<input type="number" min="0" max={duration} step="0.1" className={field+' mt-1'} value={block.endTime} disabled={locked} onChange={e=>update(index,'endTime',e.target.value)}/></label></div></li>)}</ol>
      {validation&&<p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300">{validation}</p>}
      <button className={button+' mt-5 w-full'} disabled={locked||!!validation||!duration} onClick={exportVideo}>{exporting?'Exporting…':'Download MP4 with text'}</button><p className="mt-2 text-xs text-on-surface-variant">Up to 720 pixels on the longest side. Keep this page open while exporting; shorter clips work best on phones.</p>
      {exported&&<button className="mt-3 min-h-11 w-full rounded-xl border border-primary/30 px-4 font-semibold" onClick={share}>Share or save reel</button>}
      <button className="mt-3 min-h-11 w-full text-sm underline" onClick={()=>download(new Blob([JSON.stringify(blocks,null,2)],{type:'application/json'}),'viralscript-text.json')}>Save text and timings</button>
      </div>}
    </section></div>
  </main></div>;
}
