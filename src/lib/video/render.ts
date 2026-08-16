import { mkdir } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { getNicheById } from "@/lib/niches";
import { generateNarration } from "./tts";
import { fetchFootage } from "./footage";
import { generateSubtitles } from "./subtitles";
import { composeVideo } from "./compose";

/**
 * Runs the full video pipeline for one Content item: narration (TTS) ->
 * footage (Pexels, with synthetic fallback) -> subtitle timing -> ffmpeg
 * composition. Updates Content.renderStatus at each stage so the UI can
 * show real progress rather than a bare spinner, and records renderError
 * on failure instead of leaving the record stuck in "rendering".
 */
export async function renderContentVideo(contentId: string): Promise<void> {
  const content = await db.content.findUnique({ where: { id: contentId } });
  if (!content) {
    throw new Error(`Content "${contentId}" not found`);
  }

  const niche = getNicheById(content.niche);
  if (!niche) {
    throw new Error(`Unknown niche "${content.niche}"`);
  }

  const workDir = path.join(process.cwd(), "public", "media", contentId);
  await mkdir(workDir, { recursive: true });

  try {
    await db.content.update({
      where: { id: contentId },
      data: { renderStatus: "narration", renderError: null },
    });

    const narration = await generateNarration(
      content.script,
      niche.ttsVoice,
      workDir,
    );

    await db.content.update({
      where: { id: contentId },
      data: { renderStatus: "footage" },
    });

    const visualKeywords =
      content.visualKeywords
        ?.split(",")
        .map((k) => k.trim())
        .filter(Boolean) ?? [niche.label];
    const clips = await fetchFootage(visualKeywords, niche.id, workDir);

    await db.content.update({
      where: { id: contentId },
      data: { renderStatus: "subtitles" },
    });

    const subtitlesPath = await generateSubtitles(
      content.script,
      narration.durationSeconds,
      workDir,
    );

    await db.content.update({
      where: { id: contentId },
      data: { renderStatus: "composing" },
    });

    const outputPath = path.join(workDir, "final.mp4");
    await composeVideo({
      clips,
      narrationPath: narration.audioPath,
      subtitlesPath,
      durationSeconds: narration.durationSeconds,
      outputPath,
    });

    const publicDir = `/media/${contentId}`;
    await db.content.update({
      where: { id: contentId },
      data: {
        renderStatus: "rendered",
        audioUrl: `${publicDir}/${path.basename(narration.audioPath)}`,
        videoUrl: `${publicDir}/final.mp4`,
      },
    });
  } catch (err) {
    await db.content.update({
      where: { id: contentId },
      data: {
        renderStatus: "failed",
        renderError: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}
