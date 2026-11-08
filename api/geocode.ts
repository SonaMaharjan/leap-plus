// GET /api/geocode?q=text — place search (Ireland only): Photon for shops and addresses, Transitous as backup.
import { json } from "./_lib/http.js";
import { cached, getJson, PHOTON, PHOTON_PARAMS, transitous, trimGeocode, trimPhoton, type Place } from "./_lib/journey.js";

async function photon(text: string): Promise<Place[]> {
  try {
    return trimPhoton(await getJson(`${PHOTON}?q=${encodeURIComponent(text)}&${PHOTON_PARAMS}`));
  } catch (err) {
    console.error(`geocode: photon failure ${err instanceof Error ? err.name : "unknown"}`);
    return [];
  }
}

export async function GET(req: Request): Promise<Response> {
  const text = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (text.length < 2 || text.length > 80) return json({ error: "BAD_REQUEST" }, 400);
  const places = await photon(text);
  if (places.length) return cached({ places }, 3600);
  try {
    const raw = await transitous(`/geocode?text=${encodeURIComponent(text)}&language=en`);
    return cached({ places: trimGeocode(raw) }, 3600);
  } catch (err) {
    console.error(`geocode: upstream failure ${err instanceof Error ? err.name : "unknown"}`);
    return json({ error: "UPSTREAM_ERROR" }, 502);
  }
}
