export function Placeholder({ title, screen }: { title: string; screen: string }) {
  return (
    <section className="p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{screen}</p>
      <h1 className="mt-1 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-ink-muted">Scaffold placeholder.</p>
    </section>
  );
}
