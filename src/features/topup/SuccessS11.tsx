import { Navigate, useNavigate } from "react-router-dom";
import { formatCents } from "../../lib/money";
import { Button } from "../../ui/Button";
import { Screen } from "../../ui/Screen";
import { useTopUpStore } from "./topupStore";

const LABELS = { GOOGLE_PAY: "Google Pay (TEST)", APPLE_PAY_SIM: "Apple Pay (simulated)", SAVED_CARD: "Saved card •••• 4242" };

export function SuccessS11() {
  const navigate = useNavigate();
  const { result, amountCents, method, reset } = useTopUpStore();
  if (!result || !method) return <Navigate to="/" replace />;
  return (
    <Screen
      footer={
        <Button
          onClick={() => {
            reset();
            navigate("/", { replace: true });
          }}
        >
          Done
        </Button>
      }
    >
      <div className="flex flex-col items-center pt-16 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand text-5xl text-white">✓</div>
        <h1 className="mt-6 text-2xl font-bold">Top-up complete</h1>
        <p className="mt-2 text-3xl font-bold text-brand-dark">+{formatCents(amountCents)}</p>
        <p className="mt-4 text-lg">New balance {formatCents(result.balanceCents)}</p>
        <dl className="mt-6 w-full space-y-1 rounded-2xl bg-neutral-50 p-4 text-left text-sm">
          <div className="flex justify-between"><dt className="text-ink-muted">Paid with</dt><dd>{LABELS[method]}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-muted">Reference</dt><dd className="font-mono">{result.txId.slice(0, 8).toUpperCase()}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-muted">Time</dt><dd>{new Date(result.createdAt).toLocaleString("en-IE")}</dd></div>
        </dl>
      </div>
    </Screen>
  );
}
