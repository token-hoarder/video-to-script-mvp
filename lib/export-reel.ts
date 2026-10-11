import { validateBlocks, type TextBlock } from './reel';
import { textCardCanvas, type TextAppearance } from './render-text';
export async function exportReel(file:File,blocks:TextBlock[],duration:number,width:number,height:number,appearance:TextAppearance,onStatus:(status:string)=>void,signal?:AbortSignal):Promise<Blob> {
  validateBlocks(blocks,duration);
  if(!window.Worker||!window.WebAssembly) throw new Error('Video export needs a modern browser such as Safari or Chrome.');
  const {FFmpeg}=await import('@ffmpeg/ffmpeg');
  const ffmpeg=new FFmpeg();
  const stop=()=>ffmpeg.terminate(); signal?.addEventListener('abort',stop,{once:true});
  const timer=setTimeout(stop,180000);
  try {
    onStatus('Preparing video export…');
    await ffmpeg.load({classWorkerURL:new URL('/ffmpeg/worker.js',window.location.origin).href,coreURL:new URL('/ffmpeg/ffmpeg-core.js',window.location.origin).href,wasmURL:new URL('/ffmpeg/ffmpeg-core.wasm',window.location.origin).href});
    if(signal?.aborted) throw new Error('Export cancelled.');
    await document.fonts.ready;
    const scale=Math.min(1,720/Math.max(width,height));
    const w=Math.max(2,Math.floor(width*scale/2)*2),h=Math.max(2,Math.floor(height*scale/2)*2);
    await ffmpeg.writeFile('input.mp4',new Uint8Array(await file.arrayBuffer()));
    const args=['-i','input.mp4']; const filters=[`[0:v]scale=${w}:${h},setsar=1[base]`];
    for(let i=0;i<blocks.length;i++) {
      const canvas=textCardCanvas(blocks[i].text,w,h,appearance);
      const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Text rendering failed.')),'image/png'));
      await ffmpeg.writeFile(`card${i}.png`,new Uint8Array(await png.arrayBuffer()));
      args.push('-loop','1','-i',`card${i}.png`);
      filters.push(`[${i===0?'base':`v${i-1}`}][${i+1}:v]overlay=0:0:enable='gte(t,${blocks[i].startTime})*lt(t,${blocks[i].endTime})'[v${i}]`);
    }
    ffmpeg.on('progress',({progress})=>onStatus(`Exporting video… ${Math.min(99,Math.max(0,Math.round(progress*100)))}%`));
    args.push('-filter_complex',filters.join(';'),'-map',`[v${blocks.length-1}]`,'-map','0:a?','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-r','30','-t',String(duration),'-movflags','+faststart','output.mp4');
    const result=await ffmpeg.exec(args,170000);
    if(result!==0) throw new Error('Export could not finish. Try a shorter or smaller video.');
    const data=await ffmpeg.readFile('output.mp4');
    if(typeof data==='string') throw new Error('Could not read exported video.');
    return new Blob([new Uint8Array(data)],{type:'video/mp4'});
  } finally {clearTimeout(timer);signal?.removeEventListener('abort',stop);ffmpeg.terminate();}
}
