import { useEffect } from "react";

export function LiveToast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);
  if (!message) return null;
  return (
    <div role="status" className="absolute inset-x-3 bottom-6 z-[1100] rounded-card bg-ink px-4 py-3 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}
