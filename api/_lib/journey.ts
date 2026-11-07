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
      const area = areas.map((a) => str(a?.name)).filter((n) => n && n !== "Éire / Ireland" && !/\bWard\b|\bED$|Electoral/.test(n)).slice(-2).reverse().join(", ");
      return { name: str(p.name) ?? "", area, lat: num(p.lat), lon: num(p.lon) };
    });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function transitous(path: string): Promise<unknown> {
  const res = await fetch(`${TRANSITOUS}${path}`, {
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
