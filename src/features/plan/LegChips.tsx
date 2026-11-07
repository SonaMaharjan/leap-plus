import { isTransit, mins, modeColor, modeLabel, type Itinerary } from "./planApi";

export function LegChips({ it }: { it: Itinerary }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {it.legs.map((l, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-ink-muted">›</span>}
          {isTransit(l) ? (
            <span className="rounded-md px-1.5 py-0.5 font-bold text-white" style={{ background: modeColor(l) }}>
              {modeLabel(l)} {l.route && l.route !== "DART" ? l.route : ""}
            </span>
          ) : (
            <span className="text-ink-muted">Walk {mins(l.durationSecs)}′</span>
          )}
        </span>
      ))}
    </div>
  );
}
