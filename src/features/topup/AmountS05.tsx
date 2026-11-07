import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CONFIG } from "../../lib/config";
import { formatCents, parseEuroToCents, validateTopUp } from "../../lib/money";
import { Button } from "../../ui/Button";
import { Screen } from "../../ui/Screen";
import { useCardStore } from "../card/cardStore";
import { useTopUpStore } from "./topupStore";

const MESSAGES = {
  INVALID_AMOUNT: "Enter an amount in euro, for example 12.50.",
  BELOW_MIN: "Minimum top-up is €5.",
  BALANCE_CAP: "Card balance cannot exceed €150.",
};

export function AmountS05() {
  const navigate = useNavigate();
  const card = useCardStore((s) => s.card);
  const { amountCents, setAmount } = useTopUpStore();
  const [custom, setCustom] = useState("");
  const [customOn, setCustomOn] = useState(false);
  if (!card) return <Navigate to="/" replace />;

  const amount = customOn ? parseEuroToCents(custom) : amountCents;
  const error = customOn && custom === "" ? null : validateTopUp(card.balanceCents, amount ?? NaN);
  const ready = amount !== null && !error && !(customOn && custom === "");

  return (
    <Screen
      back="/"
      title="Choose amount"
      footer={
        <Button
          disabled={!ready}
          onClick={() => {
            setAmount(amount!);
            navigate("/topup/method");
          }}
        >
          Continue
        </Button>
      }
    >
      <p className="text-sm text-ink-muted">Balance {formatCents(card.balanceCents)}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {CONFIG.amountChipsCents.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCustomOn(false);
              setAmount(c);
            }}
            aria-pressed={!customOn && amountCents === c}
            className={`min-h-[64px] rounded-2xl border-2 text-xl font-bold ${
              !customOn && amountCents === c ? "border-brand bg-brand-light text-brand-dark" : "border-neutral-200"
            }`}
          >
            {formatCents(c)}
          </button>
        ))}
      </div>
      <button
        onClick={() => setCustomOn(true)}
        aria-pressed={customOn}
        className={`mt-3 w-full rounded-2xl border-2 p-3 text-left ${customOn ? "border-brand" : "border-neutral-200"}`}
      >
        <span className="text-sm font-semibold">Other amount</span>
        {customOn && (
          <div className="mt-2 flex items-center gap-1 text-xl font-bold">
            €
            <input
              autoFocus
              inputMode="decimal"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="w-full bg-transparent outline-none"
              placeholder="0.00"
              aria-label="Custom amount in euro"
            />
          </div>
        )}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {MESSAGES[error]}
        </p>
      )}
    </Screen>
  );
}
