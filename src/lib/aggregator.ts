import type { Niche } from "@/lib/niches";
import { fetchYoutubeTrends } from "@/lib/sources/youtube";
import { fetchGoogleTrends } from "@/lib/sources/googleTrends";
import type { SourceError, TrendItem } from "@/lib/sources/types";

export interface AggregatedTrends {
  niche: string;
  items: TrendItem[];
  sourceErrors: SourceError[];
}

/**
 * Fetches from both trend sources in parallel. A failure in one source
 * never blocks the other — partial results are still useful, and the
 * caller surfaces sourceErrors to the UI instead of a blanket failure.
 *
 * Reddit was dropped as a third source: as of November 2025 Reddit closed
 * self-service API app creation (gated behind manual approval now) and
 * killed the old unauthenticated .json endpoints in May 2026, so there's
 * no accessible way to pull it for a personal project anymore.
 */
export async function aggregateTrends(niche: Niche): Promise<AggregatedTrends> {
  const [youtube, googleTrends] = await Promise.allSettled([
    fetchYoutubeTrends(niche),
    fetchGoogleTrends(niche),
  ]);

  const items: TrendItem[] = [];
  const sourceErrors: SourceError[] = [];

  if (youtube.status === "fulfilled") {
    items.push(...youtube.value);
  } else {
    sourceErrors.push({ source: "youtube", message: String(youtube.reason) });
  }

  if (googleTrends.status === "fulfilled") {
    items.push(...googleTrends.value);
  } else {
    sourceErrors.push({
      source: "google_trends",
      message: String(googleTrends.reason),
    });
  }

  return { niche: niche.id, items, sourceErrors };
}
