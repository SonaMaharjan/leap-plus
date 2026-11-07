import { useEffect, useState } from "react";
import { searchPlaces, type Place } from "./planApi";

export function PlaceInput({ label, value, onChange }: { label: string; value: Place | null; onChange: (p: Place | null) => void }) {
  const [text, setText] = useState(value?.name ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value) setText(value.name);
  }, [value]);

  useEffect(() => {
    if (!open || text.trim().length < 2 || text === value?.name) return setResults([]);
    let alive = true;
    const t = setTimeout(() => {
      searchPlaces(text.trim())
        .then((r) => alive && setResults(r))
        .catch(() => alive && setResults([]));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [text, open, value?.name]);

  return (
    <div className="relative">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search a place or stop"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-brand"
        />
      </label>
      {open && results.length > 0 && (
        <ul role="listbox" className="absolute z-[1100] mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          {results.map((p) => (
            <li key={`${p.lat},${p.lon}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left active:bg-neutral-100"
              >
                <span className="block text-sm font-semibold">{p.name}</span>
                {p.area && <span className="block text-xs text-ink-muted">{p.area}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
