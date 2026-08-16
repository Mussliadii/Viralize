import { db } from "@/lib/db";
import { getVideoStatistics, getTopComments } from "@/lib/sources/youtube";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/content/[id]/analytics/refresh">,
) {
  const { id } = await ctx.params;

  const content = await db.content.findUnique({ where: { id } });
  if (!content) {
    return Response.json({ error: "Content not found" }, { status: 404 });
  }
  if (!content.youtubeVideoId) {
    return Response.json(
      { error: "This content isn't linked to a YouTube video yet" },
      { status: 400 },
    );
  }

  try {
    const stats = await getVideoStatistics(content.youtubeVideoId);
    await db.analyticsSnapshot.create({
      data: {
        contentId: id,
        views: stats.viewCount,
        likes: stats.likeCount,
        comments: stats.commentCount,
      },
    });

    const comments = await getTopComments(content.youtubeVideoId);
    await db.topComment.deleteMany({ where: { contentId: id } });
    if (comments.length > 0) {
      await db.topComment.createMany({
        data: comments.map((c) => ({
          contentId: id,
          author: c.author,
          text: c.text,
          likeCount: c.likeCount,
        })),
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      {
        error: `Analytics refresh failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 502 },
    );
  }
}
