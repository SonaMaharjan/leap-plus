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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let alive = true;
    setState("scanning");
    setProgress(0);
    const start = Date.now();
    // Fills to 90% over the scan, then creeps toward 95% while the card loads.
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(elapsed < SCAN_MS ? (elapsed / SCAN_MS) * 90 : Math.min(95, 90 + (elapsed - SCAN_MS) / 200));
    }, 50);
    const t = setTimeout(async () => {
      if (hasDemoFlag("scanFail")) {
        consumeDemoFlag("scanFail");
        clearInterval(tick);
        return alive && setState("failed");
      }
      try {
        await load(DEMO_CARD);
        if (!alive) return;
        clearInterval(tick);
        setProgress(100);
        setState("found");
        setTimeout(() => alive && navigate("/", { replace: true }), 800);
      } catch {
        clearInterval(tick);
        if (alive) setState("failed");
      }
    }, SCAN_MS);
    return () => {
      alive = false;
      clearTimeout(t);
      clearInterval(tick);
    };
  }, [attempt, load, navigate]);

  return (
    <Screen back="/welcome">
      <div className="flex flex-col items-center pt-8 text-center">
        <TapIllustration state={state} />
        {state === "scanning" && (
          <>
            <h1 className="mt-6 text-xl font-bold">Hold your Leap card to the back, top of your phone</h1>
            <ScanProgress state={state} progress={progress} />
          </>
        )}
        {state === "found" && (
          <>
            <h1 className="mt-6 text-xl font-bold text-brand-dark">Card found</h1>
            <ScanProgress state={state} progress={progress} />
          </>
        )}
        {state === "failed" && (
          <div className="mt-6 w-full space-y-3">
            <h1 className="text-xl font-bold">We could not read your card.</h1>
            <ScanProgress state={state} progress={progress} />
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

function ScanProgress({ state, progress }: { state: "scanning" | "found" | "failed"; progress: number }) {
  const pct = Math.round(progress);
  const shown = state === "failed" ? 100 : pct;
  const label = state === "found" ? "Card read" : state === "failed" ? "Scan failed" : "Reading card…";
  return (
    <div className="mx-auto mt-5 w-full max-w-[260px] pb-1">
      <div className="mb-1.5 flex justify-between text-xs font-semibold">
        <span className={state === "failed" ? "text-red-600" : "text-ink-muted"}>{label}</span>
        <span className="text-ink-muted">{state === "failed" ? "simulated" : `${pct}% · simulated`}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-neutral-200"
        role="progressbar"
        aria-label="Card scan progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown}
        aria-valuetext={state === "failed" ? label : `${label} ${pct}%`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${state === "failed" ? "bg-red-500" : "bg-brand"}`}
          style={{ width: `${shown}%` }}
        />
      </div>
    </div>
  );
}
