import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { extractYoutubeVideoId } from "@/lib/sources/youtube";

interface UpdateContentBody {
  title?: string;
  script?: string;
  description?: string;
  hashtags?: string;
  platform?: string;
  publishingMethod?: "manual" | "oauth_demo";
  scheduledAt?: string;
  youtubeVideoUrl?: string;
}

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/content/[id]">,
) {
  const { id } = await ctx.params;
  const content = await db.content.findUnique({
    where: { id },
    include: {
      analytics: { orderBy: { recordedAt: "asc" } },
      comments: { orderBy: { likeCount: "desc" } },
    },
  });

  if (!content) {
    return Response.json({ error: "Content not found" }, { status: 404 });
  }

  return Response.json({ content });
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/content/[id]">,
) {
  const { id } = await ctx.params;
  const body = (await request.json()) as UpdateContentBody;

  const existing = await db.content.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Content not found" }, { status: 404 });
  }

  let youtubeVideoId: string | undefined;
  if (body.youtubeVideoUrl) {
    const extracted = extractYoutubeVideoId(body.youtubeVideoUrl);
    if (!extracted) {
      return Response.json(
        { error: "Couldn't find a video ID in that URL" },
        { status: 400 },
      );
    }
    youtubeVideoId = extracted;
  }

  const content = await db.content.update({
    where: { id },
    data: {
      title: body.title,
      script: body.script,
      description: body.description,
      hashtags: body.hashtags,
      platform: body.platform,
      publishingMethod: body.publishingMethod,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      // Scheduling flips status to "scheduled"; linking a real video (the
      // only thing that can happen after that) flips it to "published" —
      // "Auto-post via OAuth" never actually publishes on its own (PRD.md
      // §4b), so this is the same transition regardless of which
      // publishing method was picked at schedule time.
      status: body.scheduledAt
        ? "scheduled"
        : youtubeVideoId
          ? "published"
          : undefined,
      youtubeVideoId,
      youtubeVideoUrl: body.youtubeVideoUrl,
    },
  });

  return Response.json({ content });
}
