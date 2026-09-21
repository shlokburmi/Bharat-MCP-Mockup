"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const BUTTON_VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-brand text-white shadow-[0_1px_2px_rgba(182,58,13,0.15),0_10px_24px_-8px_rgba(214,69,16,0.55)] hover:bg-brand-dark hover:shadow-[0_1px_2px_rgba(182,58,13,0.2),0_14px_28px_-8px_rgba(214,69,16,0.6)] active:translate-y-px",
  secondary: "bg-surface text-ink shadow-soft hover:shadow-float",
  ghost: "text-ink-soft hover:bg-canvas hover:text-ink",
  danger: "bg-bad-soft text-bad hover:bg-bad hover:text-white",
};

const BUTTON_SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-13 px-5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  /** Adds the hover-lift used for clickable cards (result cards, surface
   *  links) — skip it for cards that just display information. */
  interactive?: boolean;
}) {
  return (
    <Tag
      className={cx(
        "rounded-2xl bg-surface shadow-soft ring-1 ring-ink/[0.04]",
        interactive && "hover-float cursor-pointer hover:shadow-float",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

type Tone = "neutral" | "brand" | "good" | "warn" | "bad";

const BADGE_TONES: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-soft",
  brand: "bg-brand-soft text-brand",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The green/red square Indian food labelling uses. */
export function VegDot({ veg }: { veg: boolean }) {
  return (
    <span
      title={veg ? "Vegetarian" : "Non-vegetarian"}
      className={cx(
        "inline-flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border",
        veg ? "border-good" : "border-bad",
      )}
    >
      <span className={cx("size-1.5 rounded-full", veg ? "bg-good" : "bg-bad")} />
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-bad">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl bg-canvas px-3.5 py-2.5 text-[15px] text-ink ring-1 ring-inset ring-line-strong " +
  "placeholder:text-ink-faint focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/40";

/** Bottom sheet, the shape a Razorpay checkout takes on a phone. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
        role="presentation"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-up shadow-lift relative w-full max-w-md rounded-t-3xl bg-surface sm:rounded-3xl"
      >
        {children}
      </div>
    </div>
  );
}

export function Money({ children }: { children: string }) {
  return <span className="tabular-nums">{children}</span>;
}
