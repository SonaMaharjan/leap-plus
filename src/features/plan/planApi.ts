import type { Itinerary, JourneyLeg, Place, PlanRes } from "../../../api/_lib/journey";

export type { Itinerary, JourneyLeg, Place };

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const searchPlaces = async (q: string) =>
  (await get<{ places: Place[] }>(`/api/geocode?q=${encodeURIComponent(q)}`)).places;

export const planJourney = (from: Place, to: Place) =>
  get<PlanRes>(`/api/plan?from=${from.lat.toFixed(6)},${from.lon.toFixed(6)}&to=${to.lat.toFixed(6)},${to.lon.toFixed(6)}`);

const TIME = new Intl.DateTimeFormat("en-IE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Dublin" });
export const hhmm = (iso: string) => (iso ? TIME.format(new Date(iso)) : "");
export const mins = (secs: number) => Math.max(1, Math.round(secs / 60));
export const isTransit = (l: JourneyLeg) => l.mode !== "WALK" && l.mode !== "BIKE" && l.mode !== "CAR";

export function modeLabel(l: JourneyLeg): string {
  if (l.mode === "TRAM") return "Luas";
  if (l.mode.includes("RAIL") || l.mode === "SUBWAY" || l.mode === "METRO") return l.route === "DART" ? "DART" : "Train";
  if (l.mode === "COACH") return "Coach";
  if (l.mode === "BUS") return "Bus";
  return l.mode.charAt(0) + l.mode.slice(1).toLowerCase();
}

export function modeColor(l: JourneyLeg): string {
  if (l.mode === "TRAM") return "#7B2D8E";
  if (l.mode.includes("RAIL") || l.mode === "SUBWAY" || l.mode === "METRO") return "#0072B9";
  if (l.mode === "WALK") return "#6B7280";
  return "#2E8A29";
}

/** "On time" / "3 min late" / "2 min early" from live vs scheduled time. Null when not live. */
export function liveStatus(l: JourneyLeg): { text: string; late: boolean } | null {
  if (!l.realTime || !l.from.time || !l.from.scheduled) return null;
  const d = Math.round((Date.parse(l.from.time) - Date.parse(l.from.scheduled)) / 60_000);
  if (d === 0) return { text: "On time", late: false };
  return d > 0 ? { text: `${d} min late`, late: true } : { text: `${-d} min early`, late: false };
}

export const walkSecs = (it: Itinerary) => it.legs.filter((l) => !isTransit(l)).reduce((s, l) => s + l.durationSecs, 0);
