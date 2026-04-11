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

export const maxDuration = 60;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, excludeHashtags = [], userHint = '' } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'No file URL provided' }, { status: 400 });
    }

    // ── Auth Guard ──────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Credit Guard ────────────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Could not verify your account credits.' }, { status: 500 });
    }

    if (profile.credits <= 0) {
      return NextResponse.json(
        { error: "You've used all your free analyses. Sign in with Google to unlock 50 credits." },
        { status: 402 }
      );
    }

    // ── Download video ──────────────────────────────────────────────────────
    const downloadRes = await fetch(fileUrl);
    if (!downloadRes.ok || !downloadRes.body) {
      return NextResponse.json({ error: 'Failed to download video.' }, { status: 500 });
    }

    const urlObj = new URL(fileUrl);
    const fileName = path.basename(urlObj.pathname) || 'video.mp4';
    const tempFilePath = path.join(os.tmpdir(), `hashtag-${Date.now()}-${fileName}`);

    const fileStream = fs.createWriteStream(tempFilePath);
    const { pipeline } = require('stream/promises');
    const { Readable } = require('stream');
    await pipeline(Readable.fromWeb(downloadRes.body as any), fileStream);

    try {
      // ── Upload to Gemini File API ─────────────────────────────────────────
      const mimeType = downloadRes.headers.get('content-type') || 'video/mp4';
      const uploadResponse = await fileManager.uploadFile(tempFilePath, {
        mimeType,
        displayName: 'User Video for Hashtag Analysis',
      });

      // Wait for Gemini to finish processing
      let fileState = await fileManager.getFile(uploadResponse.file.name);
      while (fileState.state === 'PROCESSING') {
        await delay(2000);
        fileState = await fileManager.getFile(uploadResponse.file.name);
      }

      if (fileState.state === 'FAILED') {
        throw new Error('Gemini video processing failed.');
      }

      // ── Generate Hashtags ─────────────────────────────────────────────────
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const excludeClause = excludeHashtags.length > 0
        ? `Do NOT include any of these already-selected hashtags: ${excludeHashtags.join(', ')}`
        : '';

      const hintClause = userHint
        ? `\nUser context (use this to personalise results): "${userHint}"`
        : '';

      const prompt = `You are a viral social media content strategist specializing in TikTok and Instagram Reels growth across global markets.
Analyze this video carefully — its subject, setting, mood, style, objects, actions, colors, and energy.${hintClause}

Generate THREE groups of hashtags:

1. "core" — exactly 10 hashtags that are highly specific to THIS video's actual content (subject, location, activity, mood, aesthetic). These must feel custom-written for this exact video.

2. "trending" — exactly 10 niche community hashtags that are popular on TikTok/Instagram and directly relevant to this content. Balance medium to large reach with strong relevance. No generic tags.

3. "cultural" — exactly 8 creative hashtags that mix international slang and culturally resonant words from around the world, written in English but inspired by:
   - Arabic/UAE: yalla, habibi, khaleeji, wasta, mashallah, shu, inshallah
   - Hindi/Indian: bakchodi, bhaukal, tashan, jugaad, desi, bindaas, mast, jhakaas, mazak, dhoom
   - Urdu/Pakistani: behtareen, zindagi, dil, yaar, shandaar
   - Japanese: kawaii, sugoi, ikigai, wabi, komorebi, otaku, senpai, nani
   - Spanish/LatAm: buenas, fuego, chido, chévere, jefa, cabrón, guay
   - Chinese: xixi, niu, zenme, hao, laoshi, aiya, ganbei
   Make them funny, punchy, and context-relevant. You can mix languages creatively (e.g. #YallaVibes, #HabibiMode, #BhaukalSeason, #KawaiiEnergy, #TashanOn, #DesiDhoom, #FuegoDays, #JugaadLife, #ZindagiGoals, #SugoinessUnlocked). Be creative — don't just add the word "vibes" to everything.

Rules for ALL groups:
- Every hashtag must include the # symbol.
- No hashtag from the banned list: #fyp, #foryou, #viral, #trending, #reels, #explore, #follow.
- No duplicates across any group.
${excludeClause}

Output ONLY valid JSON, no markdown:
{ "core": ["#tag", ...], "trending": ["#tag", ...], "cultural": ["#tag", ...] }`;

      const result = await model.generateContent([
        prompt,
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri,
          },
        },
      ]);

      let responseText = result.response.text();
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonOutput = JSON.parse(responseText) as { core: string[], trending: string[] };

      // Clean up Gemini file
      await fileManager.deleteFile(uploadResponse.file.name);

      // ── Decrement Credits ─────────────────────────────────────────────────
      // Decrement AFTER successful generation to avoid double-charge on error.
      await supabase
        .from('profiles')
        .update({ credits: profile.credits - 1, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      return NextResponse.json({
        data: jsonOutput,
        creditsRemaining: profile.credits - 1,
      });

    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

  } catch (err: any) {
    console.error('[generate-hashtags] Error:', err);
    const raw = err.message?.toLowerCase() ?? '';

    let message = 'An unexpected error occurred while analyzing your video.';
    let status = 500;

    if (raw.includes('503') || raw.includes('service unavailable')) {
      message = 'The Google Gemini AI is currently overloaded. Please try again in a few seconds.';
      status = 503;
    } else if (raw.includes('429') || raw.includes('quota') || raw.includes('rate limit')) {
      message = 'Our AI is experiencing high demand. Please try again in a moment.';
      status = 429;
    } else if (raw.includes('gemini video processing failed')) {
      message = 'We could not process this video format. Please try a standard MP4 or MOV file.';
      status = 422;
    }

    return NextResponse.json({ error: message }, { status });
  }
}
