import { CONFIG } from "./config";

const EUR = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

export function formatCents(cents: number): string {
  assertCents(cents);
  return EUR.format(cents / 100);
}

/** Parses user input like "12", "12.5", "€12.50" into integer cents. Returns null if invalid. */
export function parseEuroToCents(input: string): number | null {
  const s = input.replace(/[€\s]/g, "").replace(",", ".");
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

export type AmountError = "INVALID_AMOUNT" | "BELOW_MIN" | "BALANCE_CAP";

export function validateTopUp(balanceCents: number, amountCents: number): AmountError | null {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return "INVALID_AMOUNT";
  if (amountCents < CONFIG.minTopUpCents) return "BELOW_MIN";
  if (balanceCents + amountCents > CONFIG.maxBalanceCents) return "BALANCE_CAP";
  return null;
}

function assertCents(cents: number) {
  if (!Number.isSafeInteger(cents)) throw new TypeError(`Money must be integer cents, got ${cents}`);
}
