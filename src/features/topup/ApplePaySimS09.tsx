import { useState } from "react";
import { formatCents } from "../../lib/money";

type Props = { amountCents: number; onPaid: () => void; onClose: () => void };

/** Look-alike Apple Pay sheet. Simulated: Apple Pay on the web needs a verified merchant domain. */
export function ApplePaySimS09({ amountCents, onPaid, onClose }: Props) {
  const [stage, setStage] = useState<"confirm" | "faceid" | "done">("confirm");

  function pay() {
    setStage("faceid");
    setTimeout(() => setStage("done"), 1000);
    setTimeout(onPaid, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" role="dialog" aria-label="Apple Pay (simulated)">
      <div className="w-full max-w-[430px] rounded-t-3xl bg-neutral-50 p-5 pb-8 text-ink shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold"> Pay</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">Simulated</span>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-ink-muted">
            ✕
          </button>
        </div>
        <dl className="mt-4 divide-y divide-neutral-200 rounded-2xl bg-white text-sm">
          <div className="flex justify-between p-3"><dt className="text-ink-muted">Card</dt><dd className="font-medium">Demo Visa •••• 1111</dd></div>
          <div className="flex justify-between p-3"><dt className="text-ink-muted">Merchant</dt><dd className="font-medium">Leap+ Demo</dd></div>
          <div className="flex justify-between p-3"><dt className="font-semibold">Total</dt><dd className="text-lg font-bold">{formatCents(amountCents)}</dd></div>
        </dl>
        <div className="mt-6 flex flex-col items-center">
          {stage === "confirm" && (
            <button onClick={pay} className="flex flex-col items-center gap-2 text-sm font-medium text-ink-muted">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-sky-500 text-2xl text-sky-500">⌁</span>
              Double-click to pay
            </button>
          )}
          {stage === "faceid" && (
            <div className="flex flex-col items-center gap-2 text-sm text-ink-muted">
              <span className="h-14 w-14 animate-pulse rounded-2xl border-2 border-sky-500" />
              Face ID
            </div>
          )}
          {stage === "done" && (
            <div className="flex flex-col items-center gap-2 text-sm font-semibold text-sky-600">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-2xl text-white">✓</span>
              Done
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
