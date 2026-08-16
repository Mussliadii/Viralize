import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

export interface FootageClip {
  path: string;
  keyword: string;
  synthetic: boolean;
}

interface PexelsVideoFile {
  quality: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsSearchResponse {
  videos: Array<{ video_files: PexelsVideoFile[] }>;
}

/** Deterministic per-niche fallback color so the synthetic clip isn't pure black. */
const NICHE_FALLBACK_COLOR: Record<string, string> = {
  education: "0x0891B2",
  health: "0x059669",
  finance: "0x1D4ED8",
  technology: "0x334155",
  gaming: "0x7C3AED",
  beauty: "0xDB2777",
  food: "0xEA580C",
  travel: "0x0D9488",
};

/**
 * Fetches one background clip per visual keyword from Pexels. If a keyword
 * returns nothing (or the request fails), falls back to a synthetic
 * solid-color clip generated on the spot with ffmpeg — there's no bundled
 * stock-footage library shipped with this project, so a real placeholder
 * asset isn't available; synthesizing one keeps rendering from failing
 * outright on a bad search term.
 */
export async function fetchFootage(
  keywords: string[],
  niche: string,
  outputDir: string,
): Promise<FootageClip[]> {
  const clips: FootageClip[] = [];

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    try {
      const clip = await downloadPexelsClip(keyword, outputDir, i);
      clips.push(clip);
    } catch (err) {
      console.error(
        `Pexels footage search failed for "${keyword}", using a synthetic fallback clip`,
        err,
      );
      clips.push(await generateSyntheticClip(niche, keyword, outputDir, i));
    }
  }

  if (clips.length === 0) {
    clips.push(await generateSyntheticClip(niche, "fallback", outputDir, 0));
  }

  return clips;
}

async function downloadPexelsClip(
  keyword: string,
  outputDir: string,
  index: number,
): Promise<FootageClip> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error("PEXELS_API_KEY is not set");
  }

  const url = new URL("https://api.pexels.com/videos/search");
  url.searchParams.set("query", keyword);
  url.searchParams.set("orientation", "portrait");
  url.searchParams.set("per_page", "3");

  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    throw new Error(`Pexels search failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as PexelsSearchResponse;
  const video = data.videos[0];
  if (!video) {
    throw new Error(`No Pexels results for "${keyword}"`);
  }

  // Prefer a portrait file close to 1080x1920; fall back to whatever's there.
  const file =
    video.video_files.find((f) => f.width <= 1080 && f.height >= f.width) ??
    video.video_files[0];

  const videoRes = await fetch(file.link);
  if (!videoRes.ok || !videoRes.body) {
    throw new Error(`Failed to download Pexels video file for "${keyword}"`);
  }

  const clipPath = path.join(outputDir, `clip-${index}.mp4`);
  const buffer = Buffer.from(await videoRes.arrayBuffer());
  await writeFile(clipPath, buffer);

  return { path: clipPath, keyword, synthetic: false };
}

async function generateSyntheticClip(
  niche: string,
  keyword: string,
  outputDir: string,
  index: number,
): Promise<FootageClip> {
  const color = NICHE_FALLBACK_COLOR[niche] ?? "0x164E63";
  const clipPath = path.join(outputDir, `clip-${index}-synthetic.mp4`);

  await execFileAsync(ffmpegPath, [
    "-f",
    "lavfi",
    "-i",
    `color=c=${color}:s=1080x1920:d=6:r=30`,
    "-pix_fmt",
    "yuv420p",
    "-y",
    clipPath,
  ]);

  return { path: clipPath, keyword, synthetic: true };
}
