import { describe, expect, it } from "vitest";
import { dublinSecondsNow, formatEta, nextArrivals } from "./eta";
import type { Direction } from "./types";

const dir: Direction = {
  directionId: 0,
  headsign: "Test",
  shape: [],
  stops: [],
  timetable: [
    { tripId: "A", startSecs: 8 * 3600, stopOffsetsSecs: [0, 600] }, // 08:10 at stop 1
    { tripId: "B", startSecs: 8 * 3600 + 900, stopOffsetsSecs: [0, 600] }, // 08:25
    { tripId: "C", startSecs: 8 * 3600 + 1800, stopOffsetsSecs: [0, 600] }, // 08:40
    { tripId: "D", startSecs: 8 * 3600 + 2700, stopOffsetsSecs: [0, 600] }, // 08:55
    { tripId: "E", startSecs: 9 * 3600, stopOffsetsSecs: [0] }, // never reaches stop 1
  ],
};
const at = (h: number, m: number) => h * 3600 + m * 60;

describe("nextArrivals", () => {
  it("returns the next 3 scheduled arrivals after now", () => {
    const r = nextArrivals(dir, 1, at(8, 15));
    expect(r.map((a) => a.tripId)).toEqual(["B", "C", "D"]);
    expect(r.every((a) => !a.live)).toBe(true);
    expect(r[0].etaSecs).toBe(at(8, 25));
  });

  it("applies live delays and tags them Live", () => {
    const r = nextArrivals(dir, 1, at(8, 15), { B: { delaySecs: 120 } });
    expect(r[0]).toMatchObject({ tripId: "B", etaSecs: at(8, 27), delaySecs: 120, live: true });
    expect(r[1].live).toBe(false);
  });

  it("keeps a late trip whose schedule has passed but whose ETA has not", () => {
    const r = nextArrivals(dir, 1, at(8, 15), { A: { delaySecs: 600 } });
    expect(r[0]).toMatchObject({ tripId: "A", etaSecs: at(8, 20), live: true });
  });

  it("re-sorts when delays reorder buses", () => {
    const r = nextArrivals(dir, 1, at(8, 15), { B: { delaySecs: 1200 } });
    expect(r.map((a) => a.tripId)).toEqual(["C", "B", "D"]);
  });

  it("puts overnight trips (GTFS times past 24:00) first just after midnight", () => {
    const night: Direction = {
      ...dir,
      timetable: [
        { tripId: "M", startSecs: at(6, 0), stopOffsetsSecs: [0, 600] },
        { tripId: "N", startSecs: at(24, 20), stopOffsetsSecs: [0, 600] },
      ],
    };
    const r = nextArrivals(night, 1, at(0, 10));
    expect(r.map((a) => a.tripId)).toEqual(["N", "M"]);
    expect(r[0].etaSecs).toBe(at(0, 30));
    expect(nextArrivals(night, 1, at(23, 50))[0]).toMatchObject({ tripId: "N", etaSecs: at(24, 30) });
  });

  it("returns empty after the last departure", () => expect(nextArrivals(dir, 1, at(23, 0))).toEqual([]));
});

describe("formatting", () => {
  it("formats ETAs", () => {
    expect(formatEta(at(8, 25), at(8, 24) + 30)).toBe("Due");
    expect(formatEta(at(8, 25), at(8, 15))).toBe("10 min");
    expect(formatEta(at(9, 30), at(8, 15))).toBe("09:30");
  });
  it("uses the Dublin clock", () => {
    expect(dublinSecondsNow(new Date("2026-11-07T08:30:00Z"))).toBe(at(8, 30)); // GMT in winter
    expect(dublinSecondsNow(new Date("2026-07-07T08:30:00Z"))).toBe(at(9, 30)); // IST in summer
  });
});
