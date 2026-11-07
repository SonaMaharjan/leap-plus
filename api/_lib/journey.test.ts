import { describe, expect, it } from "vitest";
import { parseLatLon, trimGeocode, trimPlan } from "./journey";

describe("parseLatLon", () => {
  it("accepts Irish coordinates", () => expect(parseLatLon("53.3438,-6.2546")).toEqual({ lat: 53.3438, lon: -6.2546 }));
  it("rejects coordinates outside Ireland", () => expect(parseLatLon("51.5074,-0.1278")).toBeNull());
  it("rejects junk", () => {
    for (const v of [null, "", "53.3", "abc,def", "53.3,-6.2,1", "53.3;-6.2"]) expect(parseLatLon(v)).toBeNull();
  });
});

describe("trimPlan", () => {
  it("keeps only the fields the UI needs", () => {
    const raw = {
      itineraries: [
        {
          duration: 2460, startTime: "a", endTime: "b", transfers: 1, extra: "x",
          legs: [
            {
              mode: "BUS", routeShortName: "39A", headsign: "UCD", agencyName: "Dublin Bus", tripId: "20261107_ie_6016_1",
              from: { name: "A", lat: 53.3, lon: -6.2, secret: 1 }, to: { name: "B", lat: 53.31, lon: -6.21 },
              startTime: "s", scheduledStartTime: "ss", endTime: "e", scheduledEndTime: "se", duration: 600,
              realTime: true, legGeometry: { points: "abc", precision: 7 }, intermediateStops: [{ name: "C", lat: 1, lon: 2 }],
            },
          ],
        },
      ],
    };
    const res = trimPlan(raw);
    expect(res.itineraries[0].legs[0]).toMatchObject({ mode: "BUS", route: "39A", realTime: true, stops: [{ name: "C" }] });
    expect(JSON.stringify(res)).not.toContain("secret");
    expect(trimPlan({}).itineraries).toEqual([]);
  });
});

describe("trimGeocode", () => {
  it("drops places outside Ireland and caps results", () => {
    const raw = [
      { name: "Trinity College", lat: 53.344, lon: -6.258, areas: [{ name: "Éire / Ireland" }, { name: "Dublin" }] },
      { name: "London", lat: 51.5, lon: -0.12 },
    ];
    expect(trimGeocode(raw)).toEqual([{ name: "Trinity College", area: "Dublin", lat: 53.344, lon: -6.258 }]);
  });
});
