// Journey planning helpers: input validation and trimming of Transitous (MOTIS) responses.
export const TRANSITOUS = "https://api.transitous.org/api/v1";
export const USER_AGENT = "Leap-Mock-concept-prototype/0.1 (+https://github.com/SpiderPig107/Leap-Mock)";

// Island of Ireland bounding box. Keeps the proxy from being used as a worldwide router.
const BBOX = { minLat: 51.3, maxLat: 55.5, minLon: -10.7, maxLon: -5.4 };

export type LatLon = { lat: number; lon: number };

export function inIreland(lat: number, lon: number): boolean {
  return lat >= BBOX.minLat && lat <= BBOX.maxLat && lon >= BBOX.minLon && lon <= BBOX.maxLon;
}

export function parseLatLon(raw: string | null): LatLon | null {
  const m = raw?.match(/^(-?\d{1,2}(?:\.\d{1,7})?),(-?\d{1,3}(?:\.\d{1,7})?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  return inIreland(lat, lon) ? { lat, lon } : null;
}

export type Place = { name: string; area: string; lat: number; lon: number };
export type JourneyStop = { name: string; lat: number; lon: number };
export type JourneyLeg = {
  mode: string;
  route?: string;
  headsign?: string;
  agency?: string;
  tripId?: string;
  from: JourneyStop & { time: string; scheduled: string };
  to: JourneyStop & { time: string; scheduled: string };
  durationSecs: number;
  distanceM?: number;
  realTime: boolean;
  geometry: { points: string; precision: number };
  stops: JourneyStop[];
};
export type Itinerary = { durationSecs: number; start: string; end: string; transfers: number; legs: JourneyLeg[] };
export type PlanRes = { itineraries: Itinerary[] };

/* eslint-disable @typescript-eslint/no-explicit-any */
const str = (v: any) => (typeof v === "string" ? v : undefined);
const num = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
const stop = (s: any): JourneyStop => ({ name: str(s?.name) ?? "", lat: num(s?.lat), lon: num(s?.lon) });

export function trimPlan(raw: any): PlanRes {
  const its: any[] = Array.isArray(raw?.itineraries) ? raw.itineraries : [];
  return {
    itineraries: its.slice(0, 6).map((it) => ({
      durationSecs: num(it.duration),
      start: str(it.startTime) ?? "",
      end: str(it.endTime) ?? "",
      transfers: num(it.transfers) || 0,
      legs: (Array.isArray(it.legs) ? it.legs : []).map((l: any) => ({
        mode: str(l.mode) ?? "WALK",
        route: str(l.routeShortName) || undefined,
        headsign: str(l.headsign),
        agency: str(l.agencyName),
        tripId: str(l.tripId),
        from: { ...stop(l.from), time: str(l.startTime) ?? "", scheduled: str(l.scheduledStartTime) ?? "" },
        to: { ...stop(l.to), time: str(l.endTime) ?? "", scheduled: str(l.scheduledEndTime) ?? "" },
        durationSecs: num(l.duration),
        distanceM: typeof l.distance === "number" ? l.distance : undefined,
        realTime: l.realTime === true,
        geometry: { points: str(l.legGeometry?.points) ?? "", precision: num(l.legGeometry?.precision) || 6 },
        stops: (Array.isArray(l.intermediateStops) ? l.intermediateStops : []).map(stop),
      })),
    })),
  };
}

export function trimGeocode(raw: any): Place[] {
  const list: any[] = Array.isArray(raw) ? raw : [];
  return list
    .filter((p) => inIreland(num(p?.lat), num(p?.lon)))
    .slice(0, 6)
    .map((p) => {
      const areas: any[] = Array.isArray(p.areas) ? p.areas : [];
      const area = areas.map((a) => str(a?.name)).filter((n) => n && n !== "Éire / Ireland" && !/\bWard\b|\bD?ED\b|Electoral/.test(n)).slice(-2).reverse().join(", ");
      return { name: str(p.name) ?? "", area, lat: num(p.lat), lon: num(p.lon) };
    });
}

export const PHOTON = "https://photon.komoot.io/api/";
// Ireland box for Photon (minLon,minLat,maxLon,maxLat); results rank near Dublin city centre first.
export const PHOTON_PARAMS = `bbox=${BBOX.minLon},${BBOX.minLat},${BBOX.maxLon},${BBOX.maxLat}&lat=53.3498&lon=-6.2603&limit=10&lang=en`;

const ADMIN_NOISE = /\bWard\b|\bD?ED\b|Electoral|Municipal District/;

function metresApprox(a: LatLon, b: LatLon): number {
  const x = (b.lon - a.lon) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return Math.hypot(x, b.lat - a.lat) * 111_320;
}

/** Photon GeoJSON → places with a street address, e.g. "14 Liffey Street Upper, Dublin 1". */
export function trimPhoton(raw: any): Place[] {
  const features: any[] = Array.isArray(raw?.features) ? raw.features : [];
  const out: Place[] = [];
  for (const f of features) {
    const p = f?.properties ?? {};
    const [lon, lat] = Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates.map(Number) : [NaN, NaN];
    if (!inIreland(lat, lon)) continue;
    if (p.osm_key === "highway" && p.type !== "street" && p.osm_value !== "bus_stop") continue;
    const street = [str(p.housenumber), str(p.street)].filter(Boolean).join(" ");
    const name = str(p.name) ?? street;
    if (!name) continue;
    const county = str(p.county);
    const postalDistrict = county && /^Dublin \d+W?$/.test(county) ? county : undefined;
    const town = postalDistrict ?? [str(p.city), str(p.locality), str(p.district), county].find((t) => t && !ADMIN_NOISE.test(t));
    const area = [street, town].filter((part, i, all) => part && part !== name && all.indexOf(part) === i).join(", ");
    // Same name within 30 m (or same label within 150 m) = duplicate platform/entrance; farther = a separate branch.
    const dupe = (o: Place) => {
      const d = metresApprox(o, { lat, lon });
      return o.name === name && (d < 30 || (o.area === area && d < 150));
    };
    if (out.some(dupe)) continue;
    out.push({ name, area, lat, lon });
    if (out.length === 6) break;
  }
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function transitous(path: string): Promise<unknown> {
  return getJson(`${TRANSITOUS}${path}`);
}

export async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function cached(body: unknown, sMaxAge: number): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": `public, s-maxage=${sMaxAge}` },
  });
}
