import { CONFIG } from "../../lib/config";

export type SmartState = "idle" | "processing" | "done" | "error" | "rejected";

/** Flow D: offer the €10 top-up below €4.00; keep the card visible while an attempt is in flight or just finished. */
export function shouldShowSmartTopUp(balanceCents: number | undefined, state: SmartState): boolean {
  if (state !== "idle") return true;
  return typeof balanceCents === "number" && balanceCents < CONFIG.smartTopUpTriggerCents;
}

export function tripsLeft(balanceCents: number): number {
  return Math.max(0, Math.floor(balanceCents / CONFIG.fareCents));
}
