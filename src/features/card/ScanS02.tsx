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
        <div className="relative flex h-56 w-56 items-center justify-center">
          {state === "scanning" && <span className="absolute inset-0 animate-ping rounded-full bg-brand/20" />}
          <div
            className={`relative flex h-40 w-40 items-center justify-center rounded-full text-6xl ${
              state === "failed" ? "bg-red-50 text-red-600" : "bg-brand-light text-brand"
            }`}
          >
            {state === "found" ? "✓" : state === "failed" ? "!" : "📶"}
          </div>
        </div>
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
