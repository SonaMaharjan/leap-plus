import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../ui/Button";
import { ErrorPanel, Screen } from "../../ui/Screen";
import { LegChips } from "./LegChips";
import { PlaceInput } from "./PlaceInput";
import { hhmm, isTransit, mins, walkSecs, type Place } from "./planApi";
import { PLAN_MAX_AGE_MS, usePlanStore } from "./planStore";

const DEMOS: [Place, Place][] = [
  [
    { name: "Trinity College", area: "Dublin 2", lat: 53.3438, lon: -6.2546 },
    { name: "Dún Laoghaire", area: "Co. Dublin", lat: 53.2943, lon: -6.1339 },
  ],
  [
    { name: "Heuston Station", area: "Dublin 8", lat: 53.3464, lon: -6.2925 },
    { name: "UCD Belfield", area: "Dublin 4", lat: 53.3065, lon: -6.2216 },
  ],
];

type Sort = "fastest" | "changes" | "walking";
const SORTS: { id: Sort; label: string }[] = [
  { id: "fastest", label: "Fastest" },
  { id: "changes", label: "Fewest changes" },
  { id: "walking", label: "Least walking" },
];

/** S16 Journey planner: from/to search and route comparison. */
export function PlanS16() {
  const { from, to, itineraries, plannedAt, status, setFrom, setTo, swap, plan } = usePlanStore();
  const [sort, setSort] = useState<Sort>("fastest");

  useEffect(() => {
    if (itineraries && status !== "loading" && (!plannedAt || Date.now() - plannedAt > PLAN_MAX_AGE_MS)) void plan();
    // Re-plan stale results once on entry only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    const list = (itineraries ?? []).map((it, idx) => ({ it, idx }));
    const key = (x: (typeof list)[number]) =>
      sort === "fastest" ? x.it.durationSecs : sort === "changes" ? x.it.transfers * 1e6 + x.it.durationSecs : walkSecs(x.it) * 1e3 + x.it.durationSecs;
    return list.sort((a, b) => key(a) - key(b));
  }, [itineraries, sort]);
  const fastest = itineraries?.length ? Math.min(...itineraries.map((i) => i.durationSecs)) : 0;

  return (
    <Screen title="Plan a journey">
      <div className="space-y-3">
        <PlaceInput label="From" value={from} onChange={setFrom} />
        <div className="flex justify-end">
          <button onClick={swap} aria-label="Swap from and to" className="-my-2 rounded-full px-3 py-1 text-sm font-semibold text-brand active:bg-neutral-100">
            ⇅ Swap
          </button>
        </div>
        <PlaceInput label="To" value={to} onChange={setTo} />
        <Button onClick={() => void plan()} disabled={!from || !to || status === "loading"}>
          {status === "loading" ? "Finding routes…" : "Find routes"}
        </Button>
        {!from && !to && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="w-full text-ink-muted">Try:</span>
            {DEMOS.map(([a, b]) => (
              <button
                key={a.name}
                onClick={() => {
                  setFrom(a);
                  setTo(b);
                }}
                className="rounded-full border border-neutral-300 px-3 py-1.5 font-semibold"
              >
                {a.name} → {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="mt-4">
          <ErrorPanel message="Journey planner unavailable. Try again." action={<Button onClick={() => void plan()}>Try again</Button>} />
        </div>
      )}

      {itineraries && (
        <section className="mt-5">
          <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Sort routes">
            {SORTS.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={sort === s.id}
                onClick={() => setSort(s.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${sort === s.id ? "bg-brand text-white" : "bg-neutral-100 text-ink"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {itineraries.length === 0 && <p className="text-sm text-ink-muted">No public transport routes found. Try nearby places.</p>}
          <ul className="space-y-2">
            {sorted.map(({ it, idx }) => {
              const live = it.legs.some((l) => isTransit(l) && l.realTime);
              return (
                <li key={idx}>
                  <Link to={`/plan/${idx}`} className="block rounded-card border border-neutral-200 p-3 active:bg-neutral-50">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold">{mins(it.durationSecs)} min</span>
                      <span className="text-sm text-ink-muted">
                        {hhmm(it.start)} – {hhmm(it.end)}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <LegChips it={it} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                      <span>{it.transfers === 0 ? "Direct" : `${it.transfers} change${it.transfers > 1 ? "s" : ""}`}</span>
                      <span>Walk {mins(walkSecs(it))} min</span>
                      {it.durationSecs === fastest && <span className="font-semibold text-brand">Fastest</span>}
                      {live && <span className="font-semibold text-brand">● Live times</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11px] text-ink-muted">Routes: Transitous (open data, TFI GTFS). Live bus positions: NTA.</p>
        </section>
      )}
    </Screen>
  );
}
