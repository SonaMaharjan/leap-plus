import type { Direction, RealtimeRes } from "./types";

export type Arrival = {
  tripId: string;
  scheduledSecs: number;
  etaSecs: number;
  delaySecs: number;
  live: boolean;
};

const TZ = "Europe/Dublin";
const DAY = 86_400;

/** Seconds since local midnight in Dublin (GTFS service-day clock). */
export function dublinSecondsNow(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get("hour") * 3600 + get("minute") * 60 + get("second");
}

/**
 * Next arrivals at one stop (Tech Spec 7.3): scheduled = tripStart + stopOffset;
 * with a live delay for the trip → eta = scheduled + delay, tagged Live; otherwise Scheduled.
 */
export function nextArrivals(
  direction: Direction,
  stopIndex: number,
  nowSecs: number,
  tripDelays: RealtimeRes["tripDelays"] = {},
  count = 3,
): Arrival[] {
  const out: Arrival[] = [];
  for (const trip of direction.timetable) {
    const offset = trip.stopOffsetsSecs[stopIndex];
    if (typeof offset !== "number") continue;
    const scheduledSecs = trip.startSecs + offset;
    const d = tripDelays[trip.tripId];
    const delaySecs = d ? d.delaySecs : 0;
    let etaSecs = scheduledSecs + delaySecs;
    // After midnight, the previous service day's late trips (GTFS times ≥ 24:00) are still upcoming.
    if (etaSecs >= DAY && nowSecs < DAY / 2 && etaSecs - DAY >= nowSecs) etaSecs -= DAY;
    if (etaSecs < nowSecs) continue;
    out.push({ tripId: trip.tripId, scheduledSecs, etaSecs, delaySecs, live: Boolean(d) });
  }
  return out.sort((a, b) => a.etaSecs - b.etaSecs).slice(0, count);
}

export function formatClock(secs: number): string {
  const s = ((secs % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "Due", "7 min", or "14:05" for anything an hour or more away. */
export function formatEta(etaSecs: number, nowSecs: number): string {
  const mins = Math.floor((etaSecs - nowSecs) / 60);
  if (mins < 1) return "Due";
  if (mins < 60) return `${mins} min`;
  return formatClock(etaSecs);
}

export function formatDelay(delaySecs: number): string {
  const mins = Math.round(delaySecs / 60);
  if (mins === 0) return "on time";
  return mins > 0 ? `${mins} min late` : `${-mins} min early`;
}
