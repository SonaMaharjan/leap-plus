// GET /api/plan?from=lat,lon&to=lat,lon — public-transport itineraries via Transitous (MOTIS).
import { json } from "./_lib/http.js";
import { cached, parseLatLon, transitous, trimPlan } from "./_lib/journey.js";

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const from = parseLatLon(q.get("from"));
  const to = parseLatLon(q.get("to"));
  if (!from || !to) return json({ error: "BAD_REQUEST" }, 400);
  try {
    const raw = await transitous(
      `/plan?fromPlace=${from.lat},${from.lon}&toPlace=${to.lat},${to.lon}&numItineraries=5&detailedTransfers=false`,
    );
    return cached(trimPlan(raw), 30);
  } catch (err) {
    console.error(`plan: upstream failure ${err instanceof Error ? err.name : "unknown"}`);
    return json({ error: "UPSTREAM_ERROR" }, 502);
  }
}
