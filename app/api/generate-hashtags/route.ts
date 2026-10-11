import { analyzeVideo, analysisResponse } from '@/lib/analyze-video';
export const maxDuration=60;
export async function POST(req: Request) {
  try {
    const body=await req.json();
    const result=await analyzeVideo(body.videoPath ?? body.fileUrl,()=>`Based on visible footage, suggest relevant hashtags. Do not claim they are currently trending. Creator context: ${JSON.stringify(String(body.userHint ?? '').slice(0,1000))}. Return JSON {core:string[],trending:string[],cultural:string[]}, 5 hashtags per array.`,raw=>{
      const data=raw as Record<string,unknown>;
      for(const key of ['core','trending','cultural']) if(!Array.isArray(data[key])||data[key].length>10||!(data[key] as unknown[]).every(x=>typeof x==='string'&&/^#[\p{L}\p{N}_]{1,50}$/u.test(x))) throw new Error('Invalid hashtags');
      return data;
    });
    return Response.json({data:result.output,creditsRemaining:result.creditsRemaining});
  } catch(error) {return analysisResponse(error);}
}
