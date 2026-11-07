import { formatCents } from "../../lib/money";
import type { Card } from "./types";

export function CardVisual({ card }: { card: Card }) {
  const updated = new Date(card.updatedAt).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-md">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>Leap+ card</span>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{card.holderType}</span>
      </div>
      <p className="mt-6 text-xs uppercase tracking-wide text-white/80">Balance</p>
      <p className="text-4xl font-bold" data-testid="balance">{formatCents(card.balanceCents)}</p>
      <div className="mt-4 flex justify-between text-xs text-white/80">
        <span>•••• {card.cardNumber.slice(-4)}</span>
        <span>Updated {updated}</span>
      </div>
    </div>
  );
}
