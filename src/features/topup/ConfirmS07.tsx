import { Navigate, useNavigate } from "react-router-dom";
import { formatCents } from "../../lib/money";
import { Button } from "../../ui/Button";
import { Screen } from "../../ui/Screen";
import { useCardStore } from "../card/cardStore";
import { useTopUpStore } from "./topupStore";

export function ConfirmS07() {
  const navigate = useNavigate();
  const card = useCardStore((s) => s.card);
  const { amountCents, start } = useTopUpStore();
  if (!card) return <Navigate to="/" replace />;
  return (
    <Screen
      back="/topup/method"
      title="Confirm payment"
      footer={
        <Button
          onClick={() => {
            start("SAVED_CARD");
            navigate("/topup/processing", { replace: true });
          }}
        >
          Pay {formatCents(amountCents)}
        </Button>
      }
    >
      <dl className="mt-2 divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
        <Row k="Card" v={`Leap+ •••• ${card.cardNumber.slice(-4)}`} />
        <Row k="Pay with" v="Saved card •••• 4242 (simulated)" />
        <Row k="Amount" v={formatCents(amountCents)} />
        <Row k="New balance" v={formatCents(card.balanceCents + amountCents)} />
      </dl>
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between px-4 py-3 text-sm">
      <dt className="text-ink-muted">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
