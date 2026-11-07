import { useEffect, useState } from "react";
import type { DataMode } from "./useRealtime";

const clock = new Intl.DateTimeFormat("en-IE", { timeZone: "Europe/Dublin", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function LiveBadge({ mode, fetchedAt, onToggle }: { mode: DataMode; fetchedAt?: string; onToggle: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let label = mode === "LIVE" ? "LIVE" : "RECORDED";
  if (fetchedAt) {
    const t = new Date(fetchedAt);
    label =
      mode === "LIVE"
        ? `LIVE · ${Math.max(0, Math.round((now - t.getTime()) / 1000))}s ago`
        : `RECORDED · ${clock.format(t)}`;
  }
  const live = mode === "LIVE";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${label}. Tap to switch data source.`}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-md ${
        live ? "bg-brand text-white" : "bg-amber-100 text-amber-900"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-white" : "bg-amber-600"}`} />
      {label}
    </button>
  );
}
