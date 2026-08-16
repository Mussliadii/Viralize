import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { path as ffprobePath } from "ffprobe-static";

const execFileAsync = promisify(execFile);

export interface NarrationResult {
  audioPath: string;
  durationSeconds: number;
}

/**
 * Synthesizes the script into an mp3 via the Microsoft Edge Read Aloud API
 * (free, no API key) and measures its real duration with ffprobe — the
 * subtitle timing step (subtitles.ts) needs that duration to space out
 * sentences proportionally.
 */
export async function generateNarration(
  script: string,
  voiceName: string,
  outputDir: string,
): Promise<NarrationResult> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioFilePath } = await tts.toFile(outputDir, script);

  const durationSeconds = await getAudioDuration(audioFilePath);
  return { audioPath: audioFilePath, durationSeconds };
}

async function getAudioDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync(ffprobePath, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const duration = parseFloat(stdout.trim());
  if (Number.isNaN(duration)) {
    throw new Error(`ffprobe could not determine duration of ${filePath}`);
  }
  return duration;
}
