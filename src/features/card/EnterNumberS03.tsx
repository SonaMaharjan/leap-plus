import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import { Screen } from "../../ui/Screen";
import { ApiError } from "./cardApi";
import { useCardStore } from "./cardStore";

export function EnterNumberS03() {
  const navigate = useNavigate();
  const load = useCardStore((s) => s.load);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const valid = /^\d{12,19}$/.test(value);

  async function submit() {
    setLoading(true);
    try {
      await load(value);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "CARD_NOT_FOUND"
          ? "We could not find this card. Check the number and try again."
          : "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      back="/welcome"
      title="Enter card number"
      footer={
        <Button disabled={!valid} loading={loading} onClick={submit}>
          Continue
        </Button>
      }
    >
      <label htmlFor="card" className="mt-4 block text-sm font-semibold">
        Leap card number
      </label>
      <input
        id="card"
        inputMode="numeric"
        autoComplete="off"
        maxLength={19}
        value={value}
        onChange={(e) => {
          setValue(e.target.value.replace(/\D/g, ""));
          setError(null);
        }}
        aria-invalid={!!error}
        aria-describedby="card-help"
        className={`mt-2 w-full rounded-xl border px-4 py-3 text-lg tracking-widest outline-none focus:ring-2 ${
          error ? "border-red-500 focus:ring-red-200" : "border-neutral-300 focus:ring-brand-light"
        }`}
        placeholder="000000000000"
      />
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>
      ) : (
        <p id="card-help" className="mt-2 text-sm text-ink-muted">You find the number on the back of your card.</p>
      )}
      <p className="mt-6 rounded-xl bg-neutral-100 p-3 text-xs text-ink-muted">
        Demo cards (fake): 300000000001 · 300000000002 · 300000000003
      </p>
    </Screen>
  );
}
