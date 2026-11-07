import { describe, expect, it } from "vitest";
import { lerpLatLng } from "./interpolate";

describe("lerpLatLng", () => {
  it("interpolates and clamps", () => {
    expect(lerpLatLng([53, -6], [54, -7], 0.5)).toEqual([53.5, -6.5]);
    expect(lerpLatLng([53, -6], [54, -7], 2)).toEqual([54, -7]);
    expect(lerpLatLng([53, -6], [54, -7], -1)).toEqual([53, -6]);
  });
});
