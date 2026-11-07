import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import { ErrorPanel, Screen } from "../../ui/Screen";
import { useCardStore } from "./cardStore";
import { TxList } from "./TxList";

export function TransactionsS12() {
  const { cardNumber, card, status, refresh } = useCardStore();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  if (!cardNumber) return <Navigate to="/welcome" replace />;
  return (
    <Screen back="/" title="Transactions">
      {status === "error" && (
        <ErrorPanel message="Could not load transactions." action={<Button variant="secondary" onClick={() => void refresh()}>Try again</Button>} />
      )}
      {card ? <TxList txs={card.transactions} /> : <div className="mt-3 h-48 animate-pulse rounded-xl bg-neutral-100" />}
    </Screen>
  );
}
