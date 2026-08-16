import type { Niche } from "@/lib/niches";
import type { YoutubeTrendItem } from "./types";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YoutubeSearchItem {
  id: { videoId?: string };
}

interface YoutubeVideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
  };
  statistics?: {
    viewCount?: string;
  };
}

/**
 * Fetches recent, high-view videos for a niche's configured keywords.
 *
 * Quota note: `search.list` costs 100 units per call, `videos.list` costs 1.
 * With 3 keywords per niche that's ~300 units per call to this function —
 * against the 10,000/day free quota, that's roughly 30 full trend
 * refreshes/day, plenty for personal use but worth knowing before polling
 * this in a loop.
 */
export async function fetchYoutubeTrends(
  niche: Niche,
): Promise<YoutubeTrendItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }

  const publishedAfter = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const videoIds = new Set<string>();

  for (const keyword of niche.youtubeKeywords) {
    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("order", "viewCount");
    searchUrl.searchParams.set("publishedAfter", publishedAfter);
    searchUrl.searchParams.set("maxResults", "5");
    searchUrl.searchParams.set("q", keyword);
    searchUrl.searchParams.set("key", apiKey);

    const res = await fetch(searchUrl);
    if (!res.ok) {
      throw new Error(
        `YouTube search.list failed for "${keyword}": ${res.status} ${await res.text()}`,
      );
    }
    const data = (await res.json()) as { items: YoutubeSearchItem[] };
    for (const item of data.items) {
      if (item.id.videoId) videoIds.add(item.id.videoId);
    }
  }

  if (videoIds.size === 0) {
    return [];
  }

  const statsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
  statsUrl.searchParams.set("part", "snippet,statistics");
  statsUrl.searchParams.set("id", Array.from(videoIds).join(","));
  statsUrl.searchParams.set("key", apiKey);

  const statsRes = await fetch(statsUrl);
  if (!statsRes.ok) {
    throw new Error(
      `YouTube videos.list failed: ${statsRes.status} ${await statsRes.text()}`,
    );
  }
  const statsData = (await statsRes.json()) as { items: YoutubeVideoItem[] };

  const trends: YoutubeTrendItem[] = statsData.items.map((video) => ({
    source: "youtube",
    title: video.snippet.title,
    url: `https://www.youtube.com/watch?v=${video.id}`,
    viewCount: Number(video.statistics?.viewCount ?? 0),
    publishedAt: video.snippet.publishedAt,
    channelTitle: video.snippet.channelTitle,
  }));

  return trends.sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
}

export interface VideoStatistics {
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

/** `videos.list` with `part=statistics` — costs 1 unit, negligible against quota. */
export async function getVideoStatistics(
  videoId: string,
): Promise<VideoStatistics> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }

  const url = new URL(`${YOUTUBE_API_BASE}/videos`);
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `YouTube videos.list failed: ${res.status} ${await res.text()}`,
    );
  }

  const data = (await res.json()) as {
    items: Array<{
      statistics?: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
    }>;
  };
  const video = data.items[0];
  if (!video) {
    throw new Error(`No YouTube video found for id "${videoId}"`);
  }

  return {
    viewCount: Number(video.statistics?.viewCount ?? 0),
    likeCount: Number(video.statistics?.likeCount ?? 0),
    commentCount: Number(video.statistics?.commentCount ?? 0),
  };
}

export interface VideoComment {
  author: string;
  text: string;
  likeCount: number;
}

/**
 * `commentThreads.list` with `part=snippet` — costs 1 unit. Uses
 * `textOriginal` (plain text) rather than `textDisplay` (which contains
 * HTML) so the frontend never needs to render untrusted HTML from a
 * third-party API.
 */
export async function getTopComments(
  videoId: string,
  maxResults = 20,
): Promise<VideoComment[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }

  const url = new URL(`${YOUTUBE_API_BASE}/commentThreads`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);
  url.searchParams.set("order", "relevance");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    // Comments disabled on the video, or none exist yet — treat as empty
    // rather than a hard failure (see UC-07 alternate flow).
    if (res.status === 403 || res.status === 404) {
      return [];
    }
    throw new Error(
      `YouTube commentThreads.list failed: ${res.status} ${await res.text()}`,
    );
  }

  const data = (await res.json()) as {
    items?: Array<{
      snippet: {
        topLevelComment: {
          snippet: {
            authorDisplayName: string;
            textOriginal: string;
            likeCount: number;
          };
        };
      };
    }>;
  };

  return (data.items ?? []).map((item) => {
    const snippet = item.snippet.topLevelComment.snippet;
    return {
      author: snippet.authorDisplayName,
      text: snippet.textOriginal,
      likeCount: snippet.likeCount ?? 0,
    };
  });
}

/**
 * Extracts the video ID from any common YouTube URL shape
 * (watch?v=, youtu.be/, /shorts/). Returns null if the URL doesn't match.
 */
export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
    }
    return null;
  } catch {
    return null;
  }
}
