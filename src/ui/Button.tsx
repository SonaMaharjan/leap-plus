import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; loading?: boolean };

const STYLES = {
  primary: "bg-brand text-white active:bg-brand-dark disabled:bg-neutral-300 disabled:text-neutral-500",
  secondary: "border border-brand text-brand bg-white active:bg-brand-light disabled:border-neutral-300 disabled:text-neutral-400",
  ghost: "text-brand underline-offset-2 hover:underline",
};

export function Button({ variant = "primary", loading, className = "", children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition ${STYLES[variant]} ${className}`}
    >
      {loading && <Spinner small />}
      {children}
    </button>
  );
}

export function Spinner({ small }: { small?: boolean }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${small ? "h-4 w-4" : "h-10 w-10 text-brand"}`}
    />
  );
}
