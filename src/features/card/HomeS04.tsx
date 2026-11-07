import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CONFIG } from "../../lib/config";
import { Button } from "../../ui/Button";
import { ErrorPanel } from "../../ui/Screen";
import { CardVisual } from "./CardVisual";
import { useCardStore } from "./cardStore";
import { TxList } from "./TxList";

export function HomeS04() {
  const navigate = useNavigate();
  const { cardNumber, card, status, refresh, clear } = useCardStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!cardNumber) return <Navigate to="/welcome" replace />;

  return (
    <section className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My card</h1>
        <button onClick={clear} className="text-xs font-semibold text-ink-muted underline">
          Change card
        </button>
      </div>
      {card ? <CardVisual card={card} /> : <div className="h-44 animate-pulse rounded-2xl bg-neutral-200" />}
      {status === "error" && (
        <ErrorPanel
          message="Balance could not update. Showing last known balance."
          action={
            <Button variant="secondary" onClick={() => void refresh()}>
              Try again
            </Button>
          }
        />
      )}
      {card && card.balanceCents < CONFIG.smartTopUpTriggerCents && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900">Low balance. Top up before your next trip.</p>
      )}
      <Button onClick={() => navigate("/topup")} disabled={!card}>
        Top Up
      </Button>
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Recent transactions</h2>
          <Link to="/transactions" className="text-sm font-semibold text-brand">
            See all
          </Link>
        </div>
        {card ? <TxList txs={card.transactions.slice(0, 3)} /> : <div className="mt-3 h-24 animate-pulse rounded-xl bg-neutral-100" />}
      </div>
    </section>
  );
}
