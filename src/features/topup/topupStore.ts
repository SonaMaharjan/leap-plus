import { create } from "zustand";
import { CONFIG } from "../../lib/config";
import { newIdempotencyKey } from "../../lib/ids";
import type { TopUpMethod, TopUpRes } from "./topupApi";

type TopUpState = {
  amountCents: number;
  method: TopUpMethod | null;
  idempotencyKey: string | null;
  result: TopUpRes | null;
  setAmount: (cents: number) => void;
  /** Starts a new attempt with a fresh idempotency key. */
  start: (method: TopUpMethod) => void;
  finish: (res: TopUpRes) => void;
  reset: () => void;
};

export const useTopUpStore = create<TopUpState>()((set) => ({
  amountCents: CONFIG.smartTopUpAmountCents,
  method: null,
  idempotencyKey: null,
  result: null,
  setAmount: (amountCents) => set({ amountCents }),
  start: (method) => set({ method, idempotencyKey: newIdempotencyKey(), result: null }),
  finish: (result) => set({ result }),
  reset: () => set({ amountCents: CONFIG.smartTopUpAmountCents, method: null, idempotencyKey: null, result: null }),
}));
