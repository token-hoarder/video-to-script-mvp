/**
 * video-compressor.ts
 *
 * Client-side video optimization using FFmpeg.wasm.
 * Downscales heavy uploads to 720p @ 30fps before sending to Supabase.
 *
 * The FFmpeg core WASM (~30MB) is downloaded once and auto-cached by the browser.
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<void> | null = null;

/**
 * Returns a ready-to-use (loaded) FFmpeg instance.
 * Singleton — only loads the WASM core once per session.
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }

  if (!loadingPromise) {
    // Load from CDN to avoid bundling ~30MB into our app bundle
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    loadingPromise = ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    }).then(() => {});
  }

  await loadingPromise;
  return ffmpegInstance;
}

const COMPRESSION_THRESHOLD_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Checks if a file needs optimization before uploading.
 */
export function needsOptimization(file: File): boolean {
  return file.size > COMPRESSION_THRESHOLD_BYTES;
}

/**
 * Transcodes a video file to 720p @ 30fps using H.264 (superfast preset).
 *
 * @param file - The original video File object
 * @param onProgress - Progress callback (0–1)
 * @returns A new compressed File blob
 */
export async function optimizeVideoForAI(
  file: File,
  onProgress: (progress: number) => void
): Promise<File> {
  const ffmpeg = await getFFmpeg();

  // Feed progress events from FFmpeg back to the caller
  ffmpeg.on("progress", ({ progress }) => {
    onProgress(Math.min(progress, 1));
  });

  const inputName = "input.mp4";
  const outputName = "output_720p.mp4";

  // Write the source file into FFmpeg's virtual filesystem
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Transcode: scale to 720p (preserve aspect), 30fps, H.264 superfast, CRF 28
  await ffmpeg.exec([
    "-i", inputName,
    "-vf", "scale=-2:720,fps=30",
    "-vcodec", "libx264",
    "-preset", "superfast",
    "-crf", "28",
    "-acodec", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);

  // Clean up virtual filesystem
  void ffmpeg.deleteFile(inputName);
  void ffmpeg.deleteFile(outputName);

  return new File(
    [new Uint8Array((data as Uint8Array).buffer as ArrayBuffer)],
    file.name.replace(/\.[^.]+$/, "_optimized.mp4"),
    { type: "video/mp4" }
  );
}
