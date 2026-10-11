import type { TextStyle, TextPosition } from './reel';
export type TextAppearance = {style:TextStyle; position:TextPosition};
export function textCardCanvas(text:string,width:number,height:number,appearance:TextAppearance) {
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Your browser cannot render text.');
  const size=Math.round(Math.min(width,height)*(appearance.style==='bold'?0.057:0.046));
  ctx.font=`${appearance.style==='bold'?800:600} ${size}px Arial, sans-serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  const maxWidth=width*0.82; const lines:string[]=[];
  // Word wrapping plus a grapheme fallback for long unbroken text.
  let line='';
  const tokens=text.trim().split(/\s+/u);
  for(const token of tokens) {
    const next=line?`${line} ${token}`:token;
    if(ctx.measureText(next).width<=maxWidth) {line=next;continue;}
    if(line) {lines.push(line);line='';}
    for(const letter of [...token]) {
      if(ctx.measureText(line+letter).width>maxWidth&&line) {lines.push(line);line='';}
      line+=letter;
    }
  }
  if(line) lines.push(line);
  const leading=size*1.3; const boxHeight=leading*lines.length+size;
  const centerY=appearance.position==='top'?height*0.20:appearance.position==='middle'?height*0.5:height*0.76;
  const boxWidth=Math.min(width*0.9,Math.max(...lines.map(x=>ctx.measureText(x).width))+size*1.1);
  if(appearance.style==='label'||appearance.style==='clean') {
    ctx.fillStyle=appearance.style==='label'?'rgba(250,230,150,0.97)':'rgba(10,18,25,0.86)';
    ctx.beginPath(); ctx.roundRect((width-boxWidth)/2,centerY-boxHeight/2,boxWidth,boxHeight,size*0.3); ctx.fill();
  }
  lines.forEach((line,index)=>{
    const y=centerY+(index-(lines.length-1)/2)*leading;
    if(appearance.style==='bold') {ctx.strokeStyle='rgba(0,0,0,0.85)'; ctx.lineWidth=size*0.13; ctx.lineJoin='round';ctx.strokeText(line,width/2,y);}
    ctx.fillStyle=appearance.style==='label'?'#18212b':'#fff'; ctx.fillText(line,width/2,y);
  });
  return canvas;
}
