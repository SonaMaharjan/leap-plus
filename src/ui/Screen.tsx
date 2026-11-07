import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export function Screen({ title, back, children, footer }: { title?: string; back?: string | number; children: ReactNode; footer?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <section className="flex min-h-full flex-col">
      {(title || back !== undefined) && (
        <header className="flex items-center gap-2 px-4 pb-2 pt-4">
          {back !== undefined && (
            <button
              aria-label="Back"
              onClick={() => (typeof back === "number" ? navigate(back) : navigate(back))}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-2xl text-ink active:bg-neutral-100"
            >
              ‹
            </button>
          )}
          {title && <h1 className="text-xl font-bold">{title}</h1>}
        </header>
      )}
      <div className="flex-1 px-4 pb-4">{children}</div>
      {footer && <div className="sticky bottom-0 bg-white px-4 pb-4 pt-2">{footer}</div>}
    </section>
  );
}

export function ErrorPanel({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div role="alert" className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
