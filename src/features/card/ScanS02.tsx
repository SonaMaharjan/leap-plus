import { CircleAlert, CircleCheck, Nfc } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { consumeDemoFlag, hasDemoFlag } from "../../lib/demoFlags";
import { Button } from "../../ui/Button";
import { Screen } from "../../ui/Screen";
import { useCardStore } from "./cardStore";

const DEMO_CARD = "300000000001";
const SCAN_MS = 2500;

export function ScanS02() {
  const navigate = useNavigate();
  const load = useCardStore((s) => s.load);
  const [state, setState] = useState<"scanning" | "found" | "failed">("scanning");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setState("scanning");
    const t = setTimeout(async () => {
      if (hasDemoFlag("scanFail")) {
        consumeDemoFlag("scanFail");
        return alive && setState("failed");
      }
      try {
        await load(DEMO_CARD);
        if (!alive) return;
        setState("found");
        setTimeout(() => alive && navigate("/", { replace: true }), 800);
      } catch {
        if (alive) setState("failed");
      }
    }, SCAN_MS);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [attempt, load, navigate]);

  return (
    <Screen back="/welcome">
      <div className="flex flex-col items-center pt-8 text-center">
        <TapIllustration state={state} />
        {state === "scanning" && (
          <>
            <h1 className="mt-6 text-xl font-bold">Hold your Leap card to the back, top of your phone</h1>
            <p className="mt-3 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-ink-muted">Ready to scan · simulated</p>
          </>
        )}
        {state === "found" && <h1 className="mt-6 text-xl font-bold text-brand-dark">Card found</h1>}
        {state === "failed" && (
          <div className="mt-6 w-full space-y-3">
            <h1 className="text-xl font-bold">We could not read your card.</h1>
            <Button onClick={() => setAttempt((a) => a + 1)}>Try again</Button>
            <Button variant="secondary" onClick={() => navigate("/enter")}>
              Enter number instead
            </Button>
          </div>
        )}
      </div>
    </Screen>
  );
}

/** A Leap card slides to the back, top of a phone. */
function TapIllustration({ state }: { state: "scanning" | "found" | "failed" }) {
  const failed = state === "failed";
  return (
    <div className="relative h-56 w-56" aria-hidden>
      <div className={`absolute inset-4 rounded-full ${failed ? "bg-red-50" : "bg-brand-light"}`} />
      {!failed && (
        <div
          className={`absolute left-1/2 top-3 z-0 flex h-[72px] w-32 flex-col justify-between rounded-xl bg-gradient-to-br from-brand to-brand-dark p-2.5 shadow-lg ${
            state === "scanning" ? "motion-safe:animate-card-tap" : ""
          }`}
          style={{ transform: "translate(-50%, 0) rotate(-6deg)" }}
        >
          <span className="h-3 w-4 rounded-sm bg-white/70" />
          <span className="self-end text-xs font-extrabold italic tracking-tight text-white">Leap+</span>
        </div>
      )}
      <div className="absolute left-1/2 top-6 z-10 flex h-44 w-[100px] -translate-x-1/2 flex-col items-center rounded-[22px] border-[3px] border-ink bg-white shadow-xl">
        <span className="mt-1.5 h-1.5 w-8 rounded-full bg-ink" />
        <div className="flex flex-1 items-center justify-center">
          {state === "found" ? (
            <CircleCheck className="h-11 w-11 text-brand" strokeWidth={2.25} />
          ) : failed ? (
            <CircleAlert className="h-11 w-11 text-red-600" strokeWidth={2.25} />
          ) : (
            <Nfc className="h-10 w-10 text-brand motion-safe:animate-pulse" strokeWidth={2} />
          )}
        </div>
      </div>
    </div>
  );
}
