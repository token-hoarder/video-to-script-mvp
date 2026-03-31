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
    const { videoPath } = await req.json();

    if (!videoPath) {
      return NextResponse.json({ error: 'No video path provided' }, { status: 400 });
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
      .eq('video_url', videoPath)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ data: existing.generated_content });
    }

    // 1. Download the video from Supabase Storage
    const { data: videoBlob, error: downloadError } = await supabase.storage
      .from('videos')
      .download(videoPath);

    if (downloadError || !videoBlob) {
      console.error('Download error:', downloadError);
      return NextResponse.json({ error: 'Failed to download video.' }, { status: 500 });
    }

    // 2. Save file temporarily
    const buffer = Buffer.from(await videoBlob.arrayBuffer());
    const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}-${path.basename(videoPath)}`);
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // 3. Upload to Gemini File API
      const response = await fileManager.uploadFile(tempFilePath, {
        mimeType: videoBlob.type,
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

      // We ask for exactly JSON structure
      const prompt = `You are an expert short-form video scriptwriter for Instagram Reels and TikTok. Analyze the attached video file. Pay close attention to the visual elements, setting, and pacing. Your task is to output exactly three distinct voiceover scripts based on the video content: 
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
        video_url: videoPath,
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
