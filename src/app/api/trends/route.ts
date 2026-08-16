import type { NextRequest } from "next/server";
import { getNicheById } from "@/lib/niches";
import { aggregateTrends } from "@/lib/aggregator";
import { rankTopics } from "@/lib/llm";

export async function GET(request: NextRequest) {
  const nicheId = request.nextUrl.searchParams.get("niche");
  const niche = nicheId ? getNicheById(nicheId) : undefined;

  if (!niche) {
    return Response.json(
      { error: `Unknown niche "${nicheId}"` },
      { status: 400 },
    );
  }

  const aggregated = await aggregateTrends(niche);

  if (aggregated.items.length === 0) {
    return Response.json(
      {
        error: "All trend sources failed",
        sourceErrors: aggregated.sourceErrors,
      },
      { status: 502 },
    );
  }

  try {
    const topics = await rankTopics(aggregated, niche);
    return Response.json({
      niche: niche.id,
      topics,
      sourceErrors: aggregated.sourceErrors,
    });
  } catch (err) {
    return Response.json(
      {
        error: `LLM ranking failed: ${err instanceof Error ? err.message : String(err)}`,
        sourceErrors: aggregated.sourceErrors,
      },
      { status: 502 },
    );
  }
}
