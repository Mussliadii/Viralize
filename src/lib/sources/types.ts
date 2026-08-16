export interface YoutubeTrendItem {
  source: "youtube";
  title: string;
  url: string;
  viewCount: number;
  publishedAt: string;
  channelTitle: string;
}

export interface GoogleTrendsItem {
  source: "google_trends";
  title: string;
  relatedQuery: string;
  value: number;
}

export type TrendItem = YoutubeTrendItem | GoogleTrendsItem;

export interface SourceError {
  source: "youtube" | "google_trends";
  message: string;
}
