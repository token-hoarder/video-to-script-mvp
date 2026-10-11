import { analyzeVideo, analysisResponse } from '@/lib/analyze-video';
import { storyPrompt, prepareDraft } from '@/lib/reel';
export const maxDuration=60;
export async function POST(req: Request) {
  try {
    const body=await req.json();
    const message=body.message ?? body.customPrompt ?? body.userScript;
    if(typeof message!=='string'||!message.trim()||message.length>1500) return Response.json({error:'Describe your story in 1–1500 characters.'},{status:400});
    const language=['English','Hindi','Hinglish'].includes(body.language)?body.language:'English';
    const tone=['Warm','Playful','Informative'].includes(body.tone)?body.tone:'Warm';
    const result=await analyzeVideo(body.videoPath ?? body.fileUrl,duration=>storyPrompt(message,language,tone,duration),prepareDraft);
    return Response.json({blocks:result.output,duration:result.duration,creditsRemaining:result.creditsRemaining});
  } catch(error) { return analysisResponse(error); }
}
