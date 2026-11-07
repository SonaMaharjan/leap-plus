import { describe, expect, it } from "vitest";
import { formatCents, parseEuroToCents, validateTopUp } from "./money";

describe("formatCents", () => {
  it("formats integer cents as euro", () => {
    expect(formatCents(320)).toBe("€3.20");
    expect(formatCents(15000)).toBe("€150.00");
  });
  it("rejects non-integer money", () => {
    expect(() => formatCents(3.2)).toThrow(TypeError);
  });
});

describe("parseEuroToCents", () => {
  it.each([
    ["10", 1000],
    ["12.5", 1250],
    ["€12.50", 1250],
    ["0,10", 10],
  ])("parses %s", (input, cents) => expect(parseEuroToCents(input)).toBe(cents));
  it.each(["", "abc", "1.234", "-5", "=1+1"])("rejects %s", (input) => expect(parseEuroToCents(input)).toBeNull());
});

describe("validateTopUp", () => {
  it("accepts the minimum", () => expect(validateTopUp(320, 500)).toBeNull());
  it("rejects below €5", () => expect(validateTopUp(320, 499)).toBe("BELOW_MIN"));
  it("rejects balance above €150", () => expect(validateTopUp(14600, 500)).toBe("BALANCE_CAP"));
  it("accepts balance exactly €150", () => expect(validateTopUp(14500, 500)).toBeNull());
  it("rejects floats", () => expect(validateTopUp(320, 500.5)).toBe("INVALID_AMOUNT"));
});
