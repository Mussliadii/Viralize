import { writeFile } from "node:fs/promises";
import path from "node:path";

function splitIntoSentences(script: string): string[] {
  const matches = script.match(/[^.!?]+[.!?]+(\s+|$)/g);
  const sentences = (matches ?? [script]).map((s) => s.trim()).filter(Boolean);
  return sentences.length > 0 ? sentences : [script.trim()];
}

function formatTimestamp(totalSeconds: number): string {
  const ms = Math.round((totalSeconds % 1) * 1000);
  const totalWholeSeconds = Math.floor(totalSeconds);
  const s = totalWholeSeconds % 60;
  const m = Math.floor(totalWholeSeconds / 60) % 60;
  const h = Math.floor(totalWholeSeconds / 3600);
  const pad = (n: number, len = 2) => n.toString().padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * Times subtitle chunks proportionally to each sentence's share of the
 * script's total character count, scaled against the narration's real
 * duration. No speech-to-text needed — we already know the exact script
 * text, unlike tools built to caption arbitrary/uploaded audio.
 */
export async function generateSubtitles(
  script: string,
  durationSeconds: number,
  outputDir: string,
): Promise<string> {
  const sentences = splitIntoSentences(script);
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);

  let cursor = 0;
  const entries = sentences.map((sentence, i) => {
    const share = totalChars > 0 ? sentence.length / totalChars : 1 / sentences.length;
    const start = cursor;
    const end = i === sentences.length - 1 ? durationSeconds : cursor + share * durationSeconds;
    cursor = end;
    return { index: i + 1, start, end, text: sentence };
  });

  const srt = entries
    .map(
      (e) =>
        `${e.index}\n${formatTimestamp(e.start)} --> ${formatTimestamp(e.end)}\n${e.text}\n`,
    )
    .join("\n");

  const srtPath = path.join(outputDir, "subtitles.srt");
  await writeFile(srtPath, srt, "utf-8");
  return srtPath;
}
