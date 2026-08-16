import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import type { FootageClip } from "./footage";

const execFileAsync = promisify(execFile);
// ffmpeg logs a lot to stderr even on success; the default 1MB exec buffer
// isn't enough and would otherwise kill the process with ENOBUFS.
const EXEC_OPTS = { maxBuffer: 1024 * 1024 * 50 };

/** Escapes a filesystem path for safe use inside an ffmpeg filter argument
 * (the `subtitles=` filter treats `:` as an option separator, which
 * collides with Windows drive letters like `D:\...`). */
function escapeForFilter(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:");
}

async function concatClips(
  clipPaths: string[],
  outputPath: string,
): Promise<void> {
  const args: string[] = [];
  for (const clipPath of clipPaths) {
    args.push("-i", clipPath);
  }

  const scaleFilters = clipPaths
    .map(
      (_, i) =>
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30[v${i}]`,
    )
    .join(";");
  const concatInputs = clipPaths.map((_, i) => `[v${i}]`).join("");
  const filterComplex = `${scaleFilters};${concatInputs}concat=n=${clipPaths.length}:v=1:a=0[outv]`;

  args.push(
    "-filter_complex",
    filterComplex,
    "-map",
    "[outv]",
    "-pix_fmt",
    "yuv420p",
    "-y",
    outputPath,
  );

  await execFileAsync(ffmpegPath, args, EXEC_OPTS);
}

async function overlaySubtitlesAndAudio(
  footagePath: string,
  narrationPath: string,
  subtitlesPath: string,
  durationSeconds: number,
  outputPath: string,
): Promise<void> {
  const subtitleFilter = `subtitles='${escapeForFilter(subtitlesPath)}':force_style='FontName=Arial,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=80'`;

  await execFileAsync(
    ffmpegPath,
    [
      // loop the (usually shorter) footage track to cover the full narration
      "-stream_loop",
      "-1",
      "-i",
      footagePath,
      "-i",
      narrationPath,
      "-vf",
      subtitleFilter,
      "-map",
      "0:v",
      "-map",
      "1:a",
      "-t",
      durationSeconds.toFixed(2),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-y",
      outputPath,
    ],
    EXEC_OPTS,
  );
}

/**
 * Composes the final vertical (1080x1920) video: footage clips normalized
 * and concatenated, looped/trimmed to match the narration's exact
 * duration, with burned-in subtitles and the narration as the audio track.
 *
 * No background music track in v1 — there's no bundled royalty-free music
 * library to draw from, and faking one with a synthesized tone would be
 * worse than silence. The step is structured so a music mix can be added
 * later without restructuring this function.
 */
export async function composeVideo(params: {
  clips: FootageClip[];
  narrationPath: string;
  subtitlesPath: string;
  durationSeconds: number;
  outputPath: string;
}): Promise<void> {
  const { clips, narrationPath, subtitlesPath, durationSeconds, outputPath } =
    params;
  const workDir = path.dirname(outputPath);
  const combinedFootagePath = path.join(workDir, "combined-footage.mp4");

  await concatClips(
    clips.map((c) => c.path),
    combinedFootagePath,
  );
  await overlaySubtitlesAndAudio(
    combinedFootagePath,
    narrationPath,
    subtitlesPath,
    durationSeconds,
    outputPath,
  );
}
