import googleTrends from "google-trends-api";
import type { Niche } from "@/lib/niches";
import type { GoogleTrendsItem } from "./types";

interface RankedKeyword {
  query: string;
  value?: number;
  formattedValue?: string;
}

interface RelatedQueriesResponse {
  default?: {
    rankedList?: Array<{ rankedKeyword?: RankedKeyword[] }>;
  };
}

/**
 * google-trends-api is an unofficial wrapper around Google Trends' internal
 * endpoints — it can break if Google changes their response format, so every
 * keyword is fetched independently and a failure on one doesn't take down
 * the rest (errors are collected, not thrown, from this function itself;
 * the caller in aggregator.ts still wraps the whole call in a try/catch for
 * the case where every keyword fails).
 */
export async function fetchGoogleTrends(
  niche: Niche,
): Promise<GoogleTrendsItem[]> {
  const items: GoogleTrendsItem[] = [];

  for (const keyword of niche.youtubeKeywords) {
    try {
      const raw = await googleTrends.relatedQueries({ keyword });
      const parsed = JSON.parse(raw) as RelatedQueriesResponse;
      const rankedLists = parsed.default?.rankedList ?? [];
      // index 1 is the "rising" list, more useful for trend discovery than
      // index 0 ("top", which tends to be evergreen/generic terms
      const rising = rankedLists[1]?.rankedKeyword ?? [];
      const fallback = rankedLists[0]?.rankedKeyword ?? [];
      const keywords = rising.length > 0 ? rising : fallback;

      for (const ranked of keywords.slice(0, 5)) {
        items.push({
          source: "google_trends",
          title: ranked.query,
          relatedQuery: keyword,
          value: ranked.value ?? 0,
        });
      }
    } catch (err) {
      console.error(`Google Trends failed for keyword "${keyword}"`, err);
    }
  }

  return items;
}
