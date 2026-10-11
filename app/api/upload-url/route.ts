import { createClient } from '@/utils/supabase/server';
import { ownVideoPath } from '@/lib/reel';
export async function POST(req: Request) {
  try {
    const {filePath}=await req.json();
    const supabase=await createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) return Response.json({error:'Refresh to start a session.'},{status:401});
    let path: string;
    try {path=ownVideoPath(filePath,user.id,process.env.NEXT_PUBLIC_SUPABASE_URL!);} catch {return Response.json({error:'Invalid upload path.'},{status:403});}
    const {data,error}=await supabase.storage.from('videos').createSignedUploadUrl(path);
    if(error||!data) return Response.json({error:'Could not start upload. Try again.'},{status:503});
    return Response.json({signedUrl:data.signedUrl,token:data.token,path:data.path});
  } catch {return Response.json({error:'Invalid upload request.'},{status:400});}
}
