import { NICHES } from "@/lib/niches";

export async function GET() {
  const niches = NICHES.map(({ id, label, icon }) => ({ id, label, icon }));
  return Response.json({ niches });
}
