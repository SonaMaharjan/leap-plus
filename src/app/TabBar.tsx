import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Card", end: true },
  { to: "/topup", label: "Top Up", end: false },
  { to: "/live", label: "Live", end: false },
] as const;

export function TabBar() {
  return (
    <nav aria-label="Main" className="grid grid-cols-3 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `flex min-h-[56px] items-center justify-center text-sm font-semibold ${isActive ? "text-brand" : "text-ink-muted"}`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
