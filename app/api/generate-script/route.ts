import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import os from 'os';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

export const maxDuration = 60; // Max allowed duration on Vercel hobby if we use pro we can go higher

// Helper to delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, userScript, refineRequest, customPrompt, generateMode } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'No file URL provided' }, { status: 400 });
    }

    // Auth verification
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Do nothing
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if scripts already exists for this path to avoid duplicate processing
    const { data: existing } = await supabase
      .from('scripts')
      .select('*')
      .eq('video_url', fileUrl)
      .eq('user_id', user.id)
      .single();

    if (existing && !refineRequest && !customPrompt && !generateMode) {
      // Ensure the core templates actually exist before returning the cached version
      const content = existing.generated_content || {};
      if (content.aesthetic && content.funny && content.educational) {
        return NextResponse.json({ data: content });
      }
    } else if (existing && generateMode && !refineRequest && !customPrompt) {
      const content = existing.generated_content || {};
      if (content[generateMode]) {
        return NextResponse.json({ data: content });
      }
    }

    // 1. Download the video from public URL via streaming buffer
    const downloadRes = await fetch(fileUrl);
    
    if (!downloadRes.ok || !downloadRes.body) {
      console.error('Download error:', downloadRes.statusText);
      return NextResponse.json({ error: 'Failed to download video from URL.' }, { status: 500 });
    }

    // 2. Stream to temp file
    const urlObj = new URL(fileUrl);
    const fileName = path.basename(urlObj.pathname) || 'video.mp4';
    const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}-${fileName}`);
    
    const fileStream = fs.createWriteStream(tempFilePath);
    const { pipeline } = require('stream/promises');
    const { Readable } = require('stream');
    
    await pipeline(Readable.fromWeb(downloadRes.body as any), fileStream);

    try {
      // 3. Upload to Gemini File API
      const mimeType = downloadRes.headers.get('content-type') || 'video/mp4';
      const response = await fileManager.uploadFile(tempFilePath, {
        mimeType: mimeType,
        displayName: 'User Video',
      });
      console.log('Gemini file upload successful:', response.file.name);

      // Wait a moment for Gemini to process the video so it becomes ACTIVE
      let fileState = await fileManager.getFile(response.file.name);
      while (fileState.state === 'PROCESSING') {
        console.log('Waiting for video processing...');
        await delay(2000);
        fileState = await fileManager.getFile(response.file.name);
      }

      if (fileState.state === 'FAILED') {
        throw new Error('Gemini video processing failed.');
      }

      // 4. Generate Content
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      // Conditionally toggle mode based on user action
      let prompt = ``;
      if (refineRequest) {
         prompt = `You are an expert Hollywood video editor and scriptwriter. Analyze the attached video file.
Take the existing script blocks provided below and REMIX them strictly based on the user's instruction: "${refineRequest.instruction}".
You MUST ensure the pacing and duration fit the EXACT video visual timestamps previously provided.
Existing Script Blocks: ${JSON.stringify(refineRequest.currentBlocks, null, 2)}

Divide the remixed script into logical segments.
Provide timing at a 0.1s precision (e.g., 1.5).

Output exactly a JSON array of objects with the keys: 
- "startTime" (number: explicitly a float/second, e.g., 0.5)
- "endTime" (number: explicitly a float/second, e.g., 3.2)
- "text" (string: the spoken text or [Visual Break])
- "visualTrigger" (string: description of the visual moment)
- "isEdited" (boolean: true).
Output ONLY a valid JSON array without markdown formatting. do NOT wrap in a root object key.`;
      } else if (customPrompt) {
         prompt = `You are a visionary Director. Analyze the attached video visual context. 
The user has requested the following specific creative prompt: "${customPrompt}"

Logic & Constraints:
- Calculate the total duration of the uploaded video.
- Use a pacing of 130 words per minute.
- Write a short-form script tailored perfectly to the video length and visual cuts.
- Divide the script into logical segments.
- Provide timing at a 0.1s precision (e.g., 1.5).

Output exactly a JSON array of objects with the keys: 
- "startTime" (number: explicitly a float/second, e.g., 0.5)
- "endTime" (number: explicitly a float/second, e.g., 3.2)
- "text" (string: the spoken text or [Visual Break])
- "visualTrigger" (string: description of the visual moment)
- "isEdited" (boolean: true).
Output ONLY a valid JSON array without markdown formatting. do NOT wrap in a root object key.`;
      } else if (generateMode) {
        prompt = `You are an expert short-form video scriptwriter for TikTok and Reels. Analyze the attached video. 
Write a script specifically for the "${generateMode}" persona/style.
- Calculate the total duration of the uploaded video.
- Use a pacing of 130 words per minute.
- Divide the script into logical segments perfectly fit to the video length.
- Provide timing at a 0.1s precision.

Output exactly a JSON array of objects with the keys: 
- "startTime" (number: explicitly a float/second, e.g., 0.5)
- "endTime" (number: explicitly a float/second, e.g., 3.2)
- "text" (string: the spoken text or [Visual Break])
- "visualTrigger" (string: description of the visual moment)
Output ONLY a valid JSON array without markdown formatting. do NOT wrap in a root object key.`;
      } else {
        prompt = userScript 
          ? `You are an Award-winning Cinematic Director and Storyteller. Analyze the attached video visual context and the provided user script. 
User Script: "${userScript}"

Your goal is to move away from literal descriptions (e.g., 'A person packs a bag') to emotional narratives (e.g., 'Packing isn't just about clothes; it's about what you leave behind').

Logic & Constraints:
- Calculate the total duration of the uploaded video.
- Use a pacing of 130 words per minute.
- You MUST fit the script to the video. If the script is too long for the video's duration, you MUST edit/trim the text to fit perfectly.
- Divide the script into logical segments (an array of objects).
- Provide timing at a 0.1s precision (e.g., 1.5).

Output exactly a JSON array of objects with the keys: 
- "startTime" (number: explicitly a float/second, e.g., 0.5)
- "endTime" (number: explicitly a float/second, e.g., 3.2)
- "text" (string: the spoken text or [Visual Break])
- "visualTrigger" (string: description of the visual moment)
- "isEdited" (boolean: true).
Output ONLY a valid JSON array without markdown formatting.`
          : `You are an expert short-form video scriptwriter for Instagram Reels and TikTok. Analyze the attached video file. Pay close attention to the visual elements, setting, and pacing. Your task is to output exactly three distinct voiceover scripts based on the video content: 
      1. A 'Funny/Relatable' script.
      2. An 'Aesthetic/Emotional' script. 
      3. An 'Educational/Hype' script.
      
      For each script, ensure it is under 20 seconds of spoken time. Provide the exact timestamp ranges (e.g., [00:00 - 00:05]) where the text should be spoken. Output ONLY a valid JSON object without markdown formatting. The object must strictly contain the keys: "funny", "aesthetic", and "educational". Each key should contain an array of objects with "startTime", "endTime", and "text".`;
      }

      const result = await model.generateContent([
        prompt,
        {
          fileData: {
            mimeType: response.file.mimeType,
            fileUri: response.file.uri,
          },
        },
      ]);
      
      // We clean the text if it returned wrapped in markdown
      let responseText = result.response.text();
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      const jsonOutput = JSON.parse(responseText);

      // Delete file from Gemini after successful processing
      await fileManager.deleteFile(response.file.name);

      // 5. Store result in DB
      let payloadToSave = jsonOutput;
      
      if (refineRequest) {
        payloadToSave = existing ? { ...existing.generated_content, [refineRequest.slotId]: jsonOutput } : { [refineRequest.slotId]: jsonOutput };
      } else if (customPrompt) {
        payloadToSave = existing ? { ...existing.generated_content, custom_ai: jsonOutput } : { custom_ai: jsonOutput };
      } else if (generateMode) {
        payloadToSave = existing ? { ...existing.generated_content, [generateMode]: jsonOutput } : { [generateMode]: jsonOutput };
      } else {
        payloadToSave = existing ? { ...existing.generated_content, ...jsonOutput } : jsonOutput;
      }
      
      if (existing) {
         const { error: dbError } = await supabase.from('scripts').update({
           generated_content: payloadToSave
         }).eq('id', existing.id);
         if (dbError) console.error('Failed to update db:', dbError);
      } else {
         const { error: dbError } = await supabase.from('scripts').insert({
           user_id: user.id,
           video_url: fileUrl,
           generated_content: payloadToSave,
         });
         if (dbError) console.error('Failed to save to db:', dbError);
      }

      return NextResponse.json({ data: payloadToSave });
    } finally {
      // Clean up local temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (err: any) {
    console.error('API Error:', err);
    
    // Default safe user-facing message
    let safeMessage = 'An unexpected error occurred while analyzing your video. Please try again.';
    let statusCode = 500;
    
    // Analyze error string to safely map known issues
    const rawError = err.message ? err.message.toLowerCase() : '';
    
    if (err.status === 429 || rawError.includes('quota') || rawError.includes('429') || rawError.includes('exhausted') || rawError.includes('rate limit')) {
      safeMessage = 'Our AI is currently experiencing high demand. Please try again in a few minutes.';
      statusCode = 429;
    } else if (rawError.includes('gemini video processing failed')) {
      safeMessage = 'We could not process this video format. Please try uploading a standard MP4 or MOV.';
      statusCode = 422;
    } else if (err.status === 401 || rawError.includes('unauthorized')) {
      safeMessage = 'You must be logged in to perform this action.';
      statusCode = 401;
    } else if (rawError.includes('timeout') || rawError.includes('econnreset') || rawError.includes('aborted')) {
      safeMessage = 'The AI request timed out. The video might be too long or complex to process.';
      statusCode = 504;
    }

    // Never return the raw err.message or stack trace to the client
    return NextResponse.json({ error: safeMessage }, { status: statusCode });
  }
}
