import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as geocode } from "../geocode";
import { parseLatLon, trimGeocode, trimPhoton, trimPlan } from "./journey";

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

  it("drops electoral-division names from the area label", () => {
    const raw = [
      {
        name: "UCD",
        lat: 53.305,
        lon: -6.217,
        areas: [
          { name: "Éire / Ireland" },
          { name: "County Dublin" },
          { name: "Dún Laoghaire-Rathdown" },
          { name: "Clonskeagh-Belfield DED 1986" },
          { name: "Roebuck" },
        ],
      },
    ];
    expect(trimGeocode(raw)[0].area).toBe("Roebuck, Dún Laoghaire-Rathdown");
  });
});

const feature = (props: Record<string, string>, lon = -6.2649, lat = 53.3476) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [lon, lat] },
  properties: props,
});

describe("trimPhoton", () => {
  it("lists each shop branch with its street address", () => {
    const raw = {
      features: [
        feature({ name: "L'Occitane", osm_key: "shop", type: "house", housenumber: "14", street: "Liffey Street Upper", district: "North City Ward 1986", city: "Dublin", county: "Dublin 1" }),
        feature({ name: "L'Occitane", osm_key: "shop", type: "house", street: "Rock Hill", district: "Blackrock-Central DED 1986", locality: "Blackrock", city: "Blackrock", county: "County Dublin" }, -6.178, 53.301),
        feature({ name: "L'Occitane", osm_key: "shop", type: "house", street: "Boardwalk", district: "Kildare", city: "The Municipal District of Kildare — Newbridge", county: "County Kildare" }, -6.9, 53.15),
        feature({ name: "L'Occitane", osm_key: "shop", type: "house", street: "Rue X", city: "Paris" }, 2.35, 48.85),
      ],
    };
    expect(trimPhoton(raw)).toEqual([
      { name: "L'Occitane", area: "14 Liffey Street Upper, Dublin 1", lat: 53.3476, lon: -6.2649 },
      { name: "L'Occitane", area: "Rock Hill, Blackrock", lat: 53.301, lon: -6.178 },
      { name: "L'Occitane", area: "Boardwalk, Kildare", lat: 53.15, lon: -6.9 },
    ]);
  });

  it("drops duplicates, street furniture and unnamed results; caps at 6", () => {
    const heuston = feature({ name: "Heuston", osm_key: "railway", type: "house", street: "Saint John's Road West", county: "Dublin 8" });
    const lamp = feature({ name: "LIFFEY STREET UPPER (C)", osm_key: "highway", type: "house", street: "Liffey Street Upper" });
    const road = feature({ name: "Liffey Street Upper", osm_key: "highway", type: "street", city: "Dublin", county: "Dublin 1" });
    const many = Array.from({ length: 8 }, (_, i) => feature({ name: `Tesco ${i}`, street: "Main Street", city: "Dublin" }));
    const stop = feature({ name: "UCD Belfield", osm_key: "highway", osm_value: "bus_stop", type: "house", street: "Stillorgan Road", county: "Dublin 4" });
    const out = trimPhoton({ features: [heuston, heuston, lamp, road, stop, feature({}), ...many] });
    expect(out.map((p) => p.name)).toEqual(["Heuston", "Liffey Street Upper", "UCD Belfield", "Tesco 0", "Tesco 1", "Tesco 2"]);
    expect(out[0].area).toBe("Saint John's Road West, Dublin 8");
    expect(out[1].area).toBe("Dublin 1");
    expect(trimPhoton(null)).toEqual([]);
  });

  it("keeps same-named branches on one street when they are far apart", () => {
    const a = feature({ name: "Tesco", street: "Main Street", city: "Dublin" }, -6.26, 53.34);
    const b = feature({ name: "Tesco", street: "Main Street", city: "Dublin" }, -6.3, 53.39);
    expect(trimPhoton({ features: [a, b] })).toHaveLength(2);
  });
});

describe("GET /api/geocode", () => {
  afterEach(() => vi.unstubAllGlobals());
  const call = () => geocode(new Request("http://x/api/geocode?q=L%27Occitane"));
  const transitousPlace = [{ name: "Trinity College", lat: 53.344, lon: -6.258, areas: [{ name: "Dublin" }] }];

  it("uses Photon, limited to Ireland", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string) => {
      urls.push(String(u));
      return Response.json({ features: [feature({ name: "L'Occitane", street: "Wicklow Street", city: "Dublin", county: "Dublin 2" })] });
    }));
    const body = await (await call()).json();
    expect(body.places).toEqual([{ name: "L'Occitane", area: "Wicklow Street, Dublin 2", lat: 53.3476, lon: -6.2649 }]);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("photon.komoot.io");
    expect(urls[0]).toContain("bbox=-10.7,51.3,-5.4,55.5");
  });

  it("falls back to Transitous when Photon fails or finds nothing", async () => {
    for (const photon of [() => new Response("x", { status: 503 }), () => Response.json({ features: [] })]) {
      vi.stubGlobal("fetch", vi.fn(async (u: string) => (String(u).includes("photon") ? photon() : Response.json(transitousPlace))));
      const res = await call();
      expect(res.status).toBe(200);
      expect((await res.json()).places[0].name).toBe("Trinity College");
      expect(res.headers.get("Cache-Control")).toContain(photon().ok ? "s-maxage=3600" : "s-maxage=60");
    }
  });

  it("returns a generic 502 when both fail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 500 })));
    const res = await call();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "UPSTREAM_ERROR" });
  });
});
