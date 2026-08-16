import type { NextRequest } from "next/server";
import { getNicheById } from "@/lib/niches";
import { generateContent, type TopicInput } from "@/lib/llm";
import { db } from "@/lib/db";

interface CreateContentBody {
  niche: string;
  topic: TopicInput & { score?: number; sourceUrl?: string };
}

export async function GET() {
  const content = await db.content.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ content });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateContentBody;
  const niche = getNicheById(body.niche);

  if (!niche) {
    return Response.json(
      { error: `Unknown niche "${body.niche}"` },
      { status: 400 },
    );
  }

  if (!body.topic?.title) {
    return Response.json({ error: "Missing topic" }, { status: 400 });
  }

  try {
    const generated = await generateContent(body.topic, niche);

    const content = await db.content.create({
      data: {
        niche: niche.id,
        topicTitle: body.topic.title,
        topicSource: body.topic.source,
        topicScore: body.topic.score ?? null,
        title: generated.title,
        script: generated.script,
        description: generated.description,
        hashtags: generated.hashtags.join(", "),
        visualKeywords: generated.visualKeywords.join(", "),
      },
    });

    return Response.json({ content }, { status: 201 });
  } catch (err) {
    return Response.json(
      {
        error: `Content generation failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 502 },
    );
  }
}
