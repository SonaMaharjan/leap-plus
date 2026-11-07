import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CONFIG } from "../../lib/config";
import { formatCents } from "../../lib/money";
import { useCardStore } from "../card/cardStore";
import { dublinSecondsNow, formatClock, formatDelay, formatEta, nextArrivals } from "./eta";
import { liveSearch, useLiveContext } from "./liveContext";
import { SmartTopUpCard } from "./SmartTopUpCard";
import { SkeletonRows } from "./StopListS14";

/** S15 stop detail: next 3 arrivals (Live vs Scheduled) and the fare row. */
export function StopDetailS15() {
  const { stopId = "" } = useParams();
  const { route, dirIdx, routeState, rt } = useLiveContext();
  const [nowSecs, setNowSecs] = useState(() => dublinSecondsNow());
  const balanceCents = useCardStore((s) => s.card?.balanceCents);
  const refreshCard = useCardStore((s) => s.refresh);
  useEffect(() => {
    void refreshCard();
  }, [refreshCard]);
  useEffect(() => {
    const t = setInterval(() => setNowSecs(dublinSecondsNow()), 15_000);
    return () => clearInterval(t);
  }, []);

  const back = (
    <Link to={`/live${liveSearch(route, dirIdx)}`} className="text-sm font-semibold text-brand-dark">
      ← All stops
    </Link>
  );

  if (routeState.status === "loading")
    return (
      <section className="px-4 pt-2">
        {back}
        <SkeletonRows rows={3} />
      </section>
    );

  const dir = routeState.status === "ok" ? routeState.data.directions[dirIdx] ?? routeState.data.directions[0] : null;
  const stopIndex = dir ? dir.stops.findIndex((s) => s.stopId === stopId) : -1;
  if (!dir || stopIndex < 0)
    return (
      <section className="px-4 pt-2">
        {back}
        <p className="mt-4 text-sm text-ink-muted">Arrival times unavailable.</p>
      </section>
    );

  const stop = dir.stops[stopIndex];
  const arrivals = nextArrivals(dir, stopIndex, nowSecs, rt.data?.tripDelays);

  return (
    <section className="px-4 pb-4 pt-2">
      {back}
      <h1 className="mt-2 text-lg font-bold leading-tight">{stop.name}</h1>
      <p className="text-xs text-ink-muted">
        Stop #{stop.code} · Route {route} to {dir.headsign}
      </p>

      <div className="mt-3 flex items-center justify-between rounded-card bg-neutral-50 px-3 py-3 text-sm">
        <span className="text-ink-muted">Leap fare</span>
        <span className="font-semibold">
          Fare {formatCents(CONFIG.fareCents)}
          {typeof balanceCents === "number" && ` · Balance ${formatCents(balanceCents)}`}
        </span>
      </div>
      <SmartTopUpCard />
      <h2 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Next arrivals</h2>
      {arrivals.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">No more departures today.</p>
      ) : (
        <ul className="mt-2 divide-y divide-neutral-100 rounded-card border border-neutral-200">
          {arrivals.map((a) => (
            <li key={a.tripId} className="flex items-center gap-3 px-3 py-3">
              <span className="w-10 rounded-md bg-brand px-1.5 py-1 text-center text-xs font-bold text-white">{route}</span>
              <div className="flex-1">
                <p className="text-base font-bold">{formatEta(a.etaSecs, nowSecs)}</p>
                <p className="text-xs text-ink-muted">
                  {formatClock(a.etaSecs)}
                  {a.live && ` · ${formatDelay(a.delaySecs)}`}
                </p>
              </div>
              {a.live ? (
                <span className="flex items-center gap-1 rounded-full bg-brand-light px-2 py-1 text-xs font-semibold text-brand-dark">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                  Live
                </span>
              ) : (
                <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-ink-muted">Scheduled</span>
              )}
            </li>
          ))}
        </ul>
      )}

    </section>
  );
}
