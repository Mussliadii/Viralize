import Groq from "groq-sdk";
import type { Niche } from "@/lib/niches";
import type { AggregatedTrends } from "@/lib/aggregator";
import type { TrendItem } from "@/lib/sources/types";

const MODEL = "openai/gpt-oss-120b";

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set");
    }
    client = new Groq({ apiKey });
  }
  return client;
}

export interface RankedTopic {
  title: string;
  score: number;
  reasoning: string;
  source: string;
  sourceUrl?: string;
}

function formatTrendItem(item: TrendItem): string {
  switch (item.source) {
    case "youtube":
      return `[YouTube] "${item.title}" — ${item.viewCount.toLocaleString()} views, channel: ${item.channelTitle} (${item.url})`;
    case "google_trends":
      return `[Google Trends] "${item.title}" — related to "${item.relatedQuery}", interest score: ${item.value}`;
  }
}

/**
 * The LLM never searches for trend data itself — it only ever sees the raw
 * items already fetched by lib/aggregator.ts, passed in as context. Its job
 * here is purely to rank and explain, not to discover.
 *
 * Provider note: originally built on Gemini, switched to Groq
 * (openai/gpt-oss-120b) after Google AI Studio's new "AQ." API key format
 * turned out to be broken against the Gemini Developer API REST endpoint
 * (401 ACCESS_TOKEN_TYPE_UNSUPPORTED — a known, unresolved Google-side bug
 * as of Aug 2026). Groq's free tier has no credit card requirement and no
 * per-token billing, just rate limits (30 req/min, 14,400 req/day).
 */
export async function rankTopics(
  aggregated: AggregatedTrends,
  niche: Niche,
): Promise<RankedTopic[]> {
  if (aggregated.items.length === 0) {
    return [];
  }

  const rawList = aggregated.items.map(formatTrendItem).join("\n");

  const prompt = `You are a content strategist helping a "${niche.label}" content creator find their next short-form video (YouTube Shorts/TikTok/Reels) idea.

Below is raw trend data pulled just now from YouTube and Google Trends for this niche:

${rawList}

From this data, propose up to 8 distinct video topic ideas. For each:
- "title": a specific, catchy content angle (not just a copy of the raw item title)
- "score": 0-100, how promising this is right now (combine recency, engagement signal, and fit for a ${niche.label} audience)
- "reasoning": 1-2 sentences on why this is worth making content about right now
- "source": which raw item(s) this idea is based on (e.g. "YouTube", "Google Trends", or "YouTube + Google Trends")
- "sourceUrl": the URL of the most relevant single raw item, if there is one

Order by score, highest first. Do not use emoji anywhere in the output.`;

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ranked_topics",
        strict: true,
        schema: {
          type: "object",
          properties: {
            topics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  score: { type: "number" },
                  reasoning: { type: "string" },
                  source: { type: "string" },
                  sourceUrl: { type: "string" },
                },
                required: [
                  "title",
                  "score",
                  "reasoning",
                  "source",
                  "sourceUrl",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["topics"],
          additionalProperties: false,
        },
      },
    },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Groq returned an empty response for rankTopics");
  }

  const parsed = JSON.parse(text) as { topics: RankedTopic[] };
  return parsed.topics.sort((a, b) => b.score - a.score);
}

export interface GeneratedContent {
  title: string;
  script: string;
  description: string;
  hashtags: string[];
  visualKeywords: string[];
}

export interface TopicInput {
  title: string;
  reasoning: string;
  source: string;
}

/**
 * Generates the actual content draft from one selected topic: a short-form
 * video script, a title, a platform description, hashtags, and a handful of
 * visual search keywords used later (Phase 3) to find matching stock
 * footage on Pexels.
 */
export async function generateContent(
  topic: TopicInput,
  niche: Niche,
): Promise<GeneratedContent> {
  const prompt = `You are a scriptwriter for a "${niche.label}" short-form video creator (YouTube Shorts/TikTok/Reels, 30-60 seconds spoken).

Topic: "${topic.title}"
Why this topic: ${topic.reasoning}

Write:
- "title": a catchy, clickable video title (different phrasing from the topic, optimized for short-form video)
- "script": the full spoken narration, 80-150 words, written to be read aloud naturally (no stage directions, no timestamps, just the words the narrator says)
- "description": a 1-3 sentence post description suitable for the video's caption, can include a hook and a soft call-to-action
- "hashtags": 5-8 relevant hashtags, without the # symbol
- "visualKeywords": 3-5 short (1-3 word) search terms for stock footage that would visually match the script, in the order they'd appear in the video

Do not use emoji anywhere in the output.`;

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "generated_content",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            script: { type: "string" },
            description: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            visualKeywords: { type: "array", items: { type: "string" } },
          },
          required: [
            "title",
            "script",
            "description",
            "hashtags",
            "visualKeywords",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Groq returned an empty response for generateContent");
  }

  return JSON.parse(text) as GeneratedContent;
}
