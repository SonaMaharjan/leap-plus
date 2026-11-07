import { Link } from "react-router-dom";
import { liveSearch, useLiveContext } from "./liveContext";

/** S14 stop list for the selected route + direction. */
export function StopListS14() {
  const { route, dirIdx, routeState, rt } = useLiveContext();
  const count = rt.data?.vehicles.filter((v) => v.route === route).length ?? 0;

  if (routeState.status === "loading") return <SkeletonRows />;
  if (routeState.status === "error") return <p className="p-4 text-sm text-ink-muted">Stops unavailable. Try again later.</p>;

  const { data } = routeState;
  const dir = data.directions[dirIdx] ?? data.directions[0];
  return (
    <section className="px-4 pb-4 pt-2">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-bold">Route {route}</h1>
        <span className="text-xs text-ink-muted">
          {count} {count === 1 ? "bus" : "buses"} on the road
        </span>
      </div>
      <p className="text-xs text-ink-muted">{data.longName}</p>
      {data.directions.length > 1 && (
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-neutral-100 p-1" role="tablist" aria-label="Direction">
          {data.directions.map((d, i) => (
            <Link
              key={d.directionId}
              to={`/live${liveSearch(route, i)}`}
              role="tab"
              aria-selected={i === dirIdx}
              className={`truncate rounded-full px-3 py-2 text-center text-xs font-semibold ${
                i === dirIdx ? "bg-white text-ink shadow" : "text-ink-muted"
              }`}
            >
              To {d.headsign}
            </Link>
          ))}
        </div>
      )}
      <ol className="mt-3">
        {dir.stops.map((s, i) => (
          <li key={`${s.stopId}-${i}`}>
            <Link
              to={`/live/stop/${encodeURIComponent(s.stopId)}${liveSearch(route, dirIdx)}`}
              className="flex min-h-[48px] items-center gap-3 border-b border-neutral-100 py-2"
            >
              <span className="relative flex h-full w-3 justify-center">
                <span className="h-3 w-3 rounded-full border-2 border-brand-dark bg-white" />
              </span>
              <span className="flex-1 text-sm">{s.name}</span>
              <span className="text-xs text-ink-muted">#{s.code}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-card bg-neutral-100" />
      ))}
    </div>
  );
}
