import { consumeDemoFlag } from "../../lib/demoFlags";
import { ApiError, postJson } from "../card/cardApi";

export { ApiError };
export type TopUpMethod = "GOOGLE_PAY" | "APPLE_PAY_SIM" | "SAVED_CARD";
export type TopUpReq = { cardNumber: string; amountCents: number; method: TopUpMethod; idempotencyKey: string };
export type TopUpRes = { balanceCents: number; txId: string; createdAt: string };

/** Credits the card. Retry with the same idempotencyKey: the server never applies a key twice. */
export async function topUp(req: TopUpReq): Promise<TopUpRes> {
  if (consumeDemoFlag("topupFail")) {
    await new Promise((r) => setTimeout(r, 1500));
    throw new ApiError("UPSTREAM_TIMEOUT", 504);
  }
  return postJson<TopUpRes>("/api/card/topup", req);
}

/** Errors where the backend refused the amount: the user must change it, a retry cannot help. */
export const isRejection = (err: unknown) =>
  err instanceof ApiError && ["BALANCE_CAP", "INVALID_AMOUNT", "IDEMPOTENCY_MISMATCH"].includes(err.code);
