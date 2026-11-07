// GET /api/geocode?q=text — place search (Ireland only) via Transitous.
import { json } from "./_lib/http.js";
import { cached, transitous, trimGeocode } from "./_lib/journey.js";

export async function GET(req: Request): Promise<Response> {
  const text = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (text.length < 2 || text.length > 80) return json({ error: "BAD_REQUEST" }, 400);
  try {
    const raw = await transitous(`/geocode?text=${encodeURIComponent(text)}&language=en`);
    return cached({ places: trimGeocode(raw) }, 3600);
  } catch (err) {
    console.error(`geocode: upstream failure ${err instanceof Error ? err.name : "unknown"}`);
    return json({ error: "UPSTREAM_ERROR" }, 502);
  }
}
