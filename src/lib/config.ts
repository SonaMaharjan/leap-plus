export const CONFIG = {
  minTopUpCents: 500,
  maxBalanceCents: 15000,
  fareCents: 200,
  smartTopUpTriggerCents: 400,
  smartTopUpAmountCents: 1000,
  amountChipsCents: [500, 1000, 2000, 3000],
  realtimePollMs: 20000,
  apiTimeoutMs: 8000,
  routes: ["E1", "39A", "16"],
} as const;

export type DemoRoute = (typeof CONFIG.routes)[number];
