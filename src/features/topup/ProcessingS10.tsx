import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, Spinner } from "../../ui/Button";
import { ErrorPanel, Screen } from "../../ui/Screen";
import { useCardStore } from "../card/cardStore";
import { isRejection, topUp } from "./topupApi";
import { useTopUpStore } from "./topupStore";

export function ProcessingS10() {
  const navigate = useNavigate();
  const cardNumber = useCardStore((s) => s.cardNumber);
  const { amountCents, method, idempotencyKey, finish } = useTopUpStore();
  const [state, setState] = useState<"busy" | "timeout" | "rejected">("busy");
  const started = useRef(false);

  const run = useCallback(async () => {
    if (!cardNumber || !method || !idempotencyKey) return;
    setState("busy");
    try {
      finish(await topUp({ cardNumber, amountCents, method, idempotencyKey }));
      navigate("/topup/success", { replace: true });
    } catch (err) {
      setState(isRejection(err) ? "rejected" : "timeout");
    }
  }, [cardNumber, amountCents, method, idempotencyKey, finish, navigate]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  if (!idempotencyKey) return <Navigate to="/topup" replace />;

  return (
    <Screen>
      {state === "busy" && (
        <div className="flex flex-col items-center pt-24 text-center">
          <Spinner />
          <p className="mt-6 text-lg font-semibold">Topping up your card…</p>
        </div>
      )}
      {state === "timeout" && (
        <div className="pt-16">
          <ErrorPanel
            message="Top-up not confirmed. You were not charged."
            action={<Button onClick={() => void run()}>Try again</Button>}
          />
        </div>
      )}
      {state === "rejected" && (
        <div className="pt-16">
          <ErrorPanel
            message="Top-up not completed. You were not charged. Card balance cannot exceed €150."
            action={<Button onClick={() => navigate("/topup", { replace: true })}>Change amount</Button>}
          />
        </div>
      )}
    </Screen>
  );
}
