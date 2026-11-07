export const METHODS = ["GOOGLE_PAY", "APPLE_PAY_SIM", "SAVED_CARD"] as const;
export type Method = (typeof METHODS)[number];
export type GetCardReq = { cardNumber: string };
export type TopUpReq = { cardNumber: string; amountCents: number; method: Method; idempotencyKey: string };

const CARD_RE = /^\d{12,19}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIN_TOPUP_CENTS = 500;
const MAX_BALANCE_CENTS = 15000;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasOnly(o: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(o).every((k) => keys.includes(k));
}

export function parseGetCard(body: unknown): GetCardReq | null {
  if (!isObject(body) || !hasOnly(body, ["cardNumber"])) return null;
  if (typeof body.cardNumber !== "string" || !CARD_RE.test(body.cardNumber)) return null;
  return { cardNumber: body.cardNumber };
}

export function parseTopUp(body: unknown): TopUpReq | "INVALID_AMOUNT" | null {
  if (!isObject(body) || !hasOnly(body, ["cardNumber", "amountCents", "method", "idempotencyKey"])) return null;
  const { cardNumber, amountCents, method, idempotencyKey } = body;
  if (typeof cardNumber !== "string" || !CARD_RE.test(cardNumber)) return null;
  if (typeof method !== "string" || !(METHODS as readonly string[]).includes(method)) return null;
  if (typeof idempotencyKey !== "string" || !UUID_RE.test(idempotencyKey)) return null;
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents)) return null;
  if (amountCents < MIN_TOPUP_CENTS || amountCents > MAX_BALANCE_CENTS) return "INVALID_AMOUNT";
  return { cardNumber, amountCents, method: method as Method, idempotencyKey };
}
