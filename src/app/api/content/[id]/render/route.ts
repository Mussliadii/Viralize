import { db } from "@/lib/db";
import { renderContentVideo } from "@/lib/video/render";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/content/[id]/render">,
) {
  const { id } = await ctx.params;

  const existing = await db.content.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Content not found" }, { status: 404 });
  }

  try {
    await renderContentVideo(id);
    const content = await db.content.findUnique({ where: { id } });
    return Response.json({ content });
  } catch (err) {
    return Response.json(
      {
        error: `Rendering failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 502 },
    );
  }
}
