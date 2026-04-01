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
    const { fileUrl, userScript } = await req.json();

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

    if (existing) {
      return NextResponse.json({ data: existing.generated_content });
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

      // Conditionally toggle mode if user provided script explicitly
      const prompt = userScript 
        ? `You are an expert video editor and scriptwriter. Analyze the attached video visual context and the provided user script. 
User Script: "${userScript}"

Divide the script into logical segments (1-2 sentences each). Time each segment based strictly on the visual context of the video. 
- If the provided script is too long for the video duration, provide an 'Edited Version' that fits the time while keeping the emotional weight. 
- If it's too short, insert specific '[Visual Break]' markers in the text field where there is no talking.

Output exactly a JSON array of objects with the keys: 
- "startTime" (number in seconds)
- "endTime" (number in seconds)
- "text" (string: the spoken text or [Visual Break])
- "visualContext" (string: description of the visual shot matching the segment).
Output ONLY a valid JSON array without markdown formatting.`
        : `You are an expert short-form video scriptwriter for Instagram Reels and TikTok. Analyze the attached video file. Pay close attention to the visual elements, setting, and pacing. Your task is to output exactly three distinct voiceover scripts based on the video content: 
      1. A 'Funny/Relatable' script.
      2. An 'Aesthetic/Emotional' script. 
      3. An 'Educational/Hype' script.
      
      For each script, ensure it is under 20 seconds of spoken time. Provide the exact timestamp ranges (e.g., [00:00 - 00:05]) where the text should be spoken to match the visual action. Output ONLY a valid JSON object without markdown formatting. The object must strictly contain the keys: "funny", "aesthetic", and "educational". Each key should contain an array of objects with "timestamp" and "text".`;

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
      const { error: dbError } = await supabase.from('scripts').insert({
        user_id: user.id,
        video_url: fileUrl,
        generated_content: jsonOutput,
      });

      if (dbError) {
        console.error('Failed to save to db:', dbError);
      }

      return NextResponse.json({ data: jsonOutput });
    } finally {
      // Clean up local temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
