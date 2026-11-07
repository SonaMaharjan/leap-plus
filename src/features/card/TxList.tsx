import { formatCents } from "../../lib/money";
import type { Tx } from "./types";

export function TxList({ txs }: { txs: Tx[] }) {
  if (txs.length === 0) return <p className="py-6 text-center text-sm text-ink-muted">No transactions yet</p>;
  return (
    <ul className="divide-y divide-neutral-100">
      {txs.map((t) => (
        <li key={t.txId} className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium">{t.description}</p>
            <p className="text-xs text-ink-muted">
              {new Date(t.createdAt).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <span className={`text-sm font-semibold ${t.amountCents > 0 ? "text-brand-dark" : "text-ink"}`}>
            {t.amountCents > 0 ? "+" : "−"}
            {formatCents(Math.abs(t.amountCents))}
          </span>
        </li>
      ))}
    </ul>
  );
}
