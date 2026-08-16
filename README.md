# Viralize

Turn what's trending in your niche into a ready-to-post video.

Pick a niche → discover what's trending right now (YouTube + Google Trends, ranked by AI) → get an AI-generated script → render it into an actual short video (narration + stock footage + burned-in subtitles) → schedule it → upload it yourself → link it back and track **real** performance (views, likes, top comments) over time.

Built for the Social Media Automation Hackathon, aimed at real depth rather than demo-safe shortcuts. Full context and every design decision (including the ones that changed mid-build) live in the planning docs one level up: [PRD.md](../PRD.md), [PLAN.md](../PLAN.md), [USE-CASES.md](../USE-CASES.md), [ALUR-SISTEM.md](../ALUR-SISTEM.md), [DESIGN.md](../DESIGN.md).

## What it does

1. **Pick a niche** — Education, Health & Wellness, Finance & Business, Technology, Gaming, Beauty & Fashion, Food & Cooking, or Travel (config-driven, easy to extend — see `src/lib/niches.ts`)
2. **Discover trends** — real data pulled live from the YouTube Data API and Google Trends, ranked and explained by an LLM (Groq)
3. **Generate content** — pick a topic, get a full script, title, description, hashtags, and visual search keywords
4. **Render a video** — AI narration (text-to-speech) + matching stock footage (Pexels) + burned-in subtitles, composed with ffmpeg into a real 1080×1920 MP4
5. **Schedule it** — pick a date/time and a publishing method (Manual Upload, or a clearly-labeled "Auto-post via OAuth" **demo** — see [PRD.md §4b](../PRD.md) for why that one doesn't actually post anywhere)
6. **Track real performance** — after you upload the video yourself, paste the link back in and refresh to pull real view/like/comment counts and the actual top comments from YouTube

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the API keys below
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### API keys needed (`.env`)

| Key | Where to get it | Notes |
|---|---|---|
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) — free, no credit card | Not `console.x.ai` — Groq and xAI/Grok are different companies with confusingly similar names. Groq keys start with `gsk_` |
| `YOUTUBE_API_KEY` | Google Cloud Console — enable "YouTube Data API v3", create an API key | Used for both trend discovery and real analytics |
| `PEXELS_API_KEY` | [pexels.com/api](https://www.pexels.com/api/) — free tier | Stock footage for video rendering |

No Reddit key — it was part of the original plan, but Reddit closed self-service API app creation in November 2025 (manual approval required now, with no guarantee for a personal project) and killed the old unauthenticated `.json` endpoints in May 2026. See [PLAN.md §3](../PLAN.md) for the full story.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, SQLite via Prisma 7, Groq API (`openai/gpt-oss-120b`) for all AI generation, `msedge-tts` + `ffmpeg-static`/`ffprobe-static` (invoked directly via `child_process`, not `fluent-ffmpeg` — see [PLAN.md §1](../PLAN.md)) for video rendering. Full breakdown and the reasoning behind every swap in [PLAN.md §1](../PLAN.md).

Not deployed to Vercel — the video-rendering pipeline needs a persistent filesystem and far longer execution time (a real render took ~90s in testing) than Vercel's serverless functions allow by default. Runs locally / self-hosted. See [PLAN.md's deployment notes](../PLAN.md) if that ever changes.

## What's real vs. simulated

Everything is real — there is no simulated/demo data path for trends, scripts, video rendering, or analytics. The one deliberate exception is **"Auto-post via OAuth"** at the scheduling step: it's a UI demo of the connect-account/consent-screen pattern, and is always labeled as such in the interface. It never contacts a real platform. "Manual Upload" is the actual working path, and is what every real published video in this app has gone through.

## Concept origin

The video-rendering idea (topic → script → narrated short video) is conceptually inspired by the open-source project [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) (MIT licensed). No code from that project is used — this is an independent implementation on a different stack (Node.js + direct ffmpeg invocation vs. their Python/Streamlit + moviepy), with a different subtitle-timing approach (proportional to the script we already generated, no speech-to-text needed). Full note in [PRD.md §2b](../PRD.md).

## Status

All 6 build phases are done and smoke-tested against live APIs with real output (real trend data, a real rendered MP4 verified with `ffprobe`, real YouTube analytics on a real video). See [PLAN.md's build phases](../PLAN.md) for the detailed log of what was tested and how. Remaining ideas are tracked as Stretch Goals in [PRD.md](../PRD.md).
