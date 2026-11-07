import { describe, expect, it } from "vitest";
import { shouldShowSmartTopUp, tripsLeft } from "./smartTopUp";

describe("shouldShowSmartTopUp", () => {
  it("shows below €4.00 only when idle", () => {
    expect(shouldShowSmartTopUp(320, "idle")).toBe(true);
    expect(shouldShowSmartTopUp(399, "idle")).toBe(true);
    expect(shouldShowSmartTopUp(400, "idle")).toBe(false);
    expect(shouldShowSmartTopUp(undefined, "idle")).toBe(false);
  });
  it("stays visible after the balance rises during an attempt", () => {
    expect(shouldShowSmartTopUp(1320, "processing")).toBe(true);
    expect(shouldShowSmartTopUp(1320, "done")).toBe(true);
    expect(shouldShowSmartTopUp(320, "error")).toBe(true);
  });
});

describe("tripsLeft", () => {
  it("counts whole fares", () => {
    expect(tripsLeft(320)).toBe(1);
    expect(tripsLeft(1320)).toBe(6);
    expect(tripsLeft(0)).toBe(0);
  });
});
