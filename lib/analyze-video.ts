import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { createClient } from '@/utils/supabase/server';
import { MAX_VIDEO_BYTES, movieDuration, ownVideoPath } from './reel';
import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export class AnalysisError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function analyzeVideo(input: unknown, prompt: (duration: number) => string, validate: (raw: unknown, duration: number) => unknown) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AnalysisError('Your session is not ready. Refresh and try again.',401);
  let videoPath: string;
  try { videoPath = ownVideoPath(input,user.id,process.env.NEXT_PUBLIC_SUPABASE_URL!); } catch { throw new AnalysisError('Only your own uploaded video can be analyzed.',403); }
  const secret = process.env.REEL_PROCESSING_SECRET;
  if (!secret || !process.env.GEMINI_API_KEY) throw new AnalysisError('Analysis is temporarily unavailable.',503);
  const requestHeaders=await headers();
  const rawIp=requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()||requestHeaders.get('x-real-ip')||'local';
  const ipHash=createHash('sha256').update(secret+rawIp).digest('hex');
  const { data: claim, error: claimError } = await supabase.rpc('reserve_reel_credit',{server_secret:secret,request_ip_hash:ipHash});
  if (claimError || !claim) {
    const message = claimError?.message ?? '';
    throw new AnalysisError(message.includes('No credits') ? 'No analyses remaining. Sign in to continue.' : message.includes('running') ? 'An analysis is already running. Please wait.' : message.includes('Hourly') ? 'Hourly limit reached. Try again later.' : 'Could not verify credits. Please try again.', message.includes('No credits') ? 402 : message.includes('Hourly') || message.includes('running') ? 429 : 503);
  }
  let googleFile: string | undefined; let directory: string | undefined; let finished = false;
  const manager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!, {timeout:10000});
  const deadline = Date.now()+45000;
  try {
    const signed = await supabase.storage.from('videos').createSignedUrl(videoPath,90);
    if (signed.error || !signed.data) throw new AnalysisError('Upload missing. Select your video again.',404);
    const response = await fetch(signed.data.signedUrl,{signal:AbortSignal.timeout(12000),redirect:'error'});
    if (!response.ok || !response.body) throw new AnalysisError('Could not read your upload. Try again.',502);
    if (Number(response.headers.get('content-length'))>MAX_VIDEO_BYTES) throw new AnalysisError('Video exceeds 30 MB.',413);
    const parts: Uint8Array[] = []; let size=0;
    for await (const part of response.body as unknown as AsyncIterable<Uint8Array>) { size+=part.length; if(size>MAX_VIDEO_BYTES) { await response.body.cancel().catch(()=>{}); throw new AnalysisError('Video exceeds 30 MB.',413); } parts.push(part); }
    const bytes = Buffer.concat(parts); let duration: number;
    try { duration=movieDuration(bytes); } catch(e) { throw new AnalysisError((e as Error).message,422); }
    directory = await fs.mkdtemp(path.join(os.tmpdir(),'reel-'));
    const filename=path.join(directory,'source.mp4'); await fs.writeFile(filename,bytes);
    const uploaded=await manager.uploadFile(filename,{mimeType:videoPath.toLowerCase().endsWith('.mov')?'video/quicktime':'video/mp4',displayName:'Reel footage'}); googleFile=uploaded.file.name;
    let info=await manager.getFile(googleFile);
    while(info.state==='PROCESSING') { if(Date.now()>deadline) throw new AnalysisError('Processing took too long. Try a shorter clip.',504); await new Promise(r=>setTimeout(r,1000)); info=await manager.getFile(googleFile); }
    if(info.state!=='ACTIVE') throw new AnalysisError('This video could not be processed. Try another MP4.',422);
    const remaining=deadline-Date.now(); if(remaining<1000) throw new AnalysisError('Processing took too long.',504);
    const model=new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({model:'gemini-2.5-flash',generationConfig:{responseMimeType:'application/json',temperature:0.5}});
    const result=await model.generateContent([prompt(duration),{fileData:{fileUri:uploaded.file.uri,mimeType:uploaded.file.mimeType}}],{timeout:remaining});
    let output: unknown;
    try { output=validate(JSON.parse(result.response.text()),duration); } catch (error) { console.warn('Draft validation failed:',error instanceof Error?error.message:'Invalid output'); throw new AnalysisError('The draft did not meet timing or readability checks. Your credit was returned; try again with a shorter message.',422); }
    const completed=await supabase.rpc('finish_reel_credit',{server_secret:secret,job_id:claim.jobId,succeeded:true});
    if(completed.error) throw new AnalysisError('Could not finish this analysis. Please try again.',503);
    finished=true;
    return {output,duration,creditsRemaining:completed.data};
  } finally {
    if(!finished) await supabase.rpc('finish_reel_credit',{server_secret:secret,job_id:claim.jobId,succeeded:false});
    if(googleFile) await manager.deleteFile(googleFile).catch(()=>console.error('Temporary AI file cleanup failed'));
    if(directory) await fs.rm(directory,{recursive:true,force:true});
    await supabase.storage.from('videos').remove([videoPath]);
  }
}
export function analysisResponse(error: unknown) {
  if(error instanceof AnalysisError) return Response.json({error:error.message},{status:error.status});
  const code=(error as {status?:number})?.status;
  return Response.json({error:code===429?'AI is busy. Your credit was returned. Try later.':'Analysis failed. Your credit was returned. Try a shorter clip.'},{status:code===429?429:502});
}
