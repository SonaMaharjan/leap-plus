import { Navigate, useNavigate } from "react-router-dom";
import { formatCents } from "../../lib/money";
import { Screen } from "../../ui/Screen";
import { useCardStore } from "../card/cardStore";
import { useTopUpStore } from "./topupStore";

export function MethodS06() {
  const navigate = useNavigate();
  const card = useCardStore((s) => s.card);
  const amountCents = useTopUpStore((s) => s.amountCents);
  if (!card) return <Navigate to="/" replace />;
  return (
    <Screen back="/topup" title="Pay with">
      <p className="text-sm text-ink-muted">Top-up {formatCents(amountCents)}</p>
      <div className="mt-4 space-y-3">
        <button
          onClick={() => navigate("/topup/confirm")}
          className="flex min-h-[56px] w-full items-center justify-between rounded-2xl border-2 border-neutral-200 px-4 text-left font-semibold active:bg-neutral-50"
        >
          <span>💳 Saved card •••• 4242</span>
          <span className="text-ink-muted">›</span>
        </button>
      </div>
    </Screen>
  );
}
