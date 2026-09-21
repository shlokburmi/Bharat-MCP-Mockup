import Link from "next/link";

export default function OrderNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <span aria-hidden className="text-4xl">
        🔍
      </span>
      <h1 className="mt-3 text-xl font-semibold text-ink">We couldn&apos;t find that order</h1>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">
        The link may be from an older session — the mock store resets whenever the server restarts.
      </p>
      <Link
        href="/chat"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 font-medium text-white hover:bg-brand-dark"
      >
        Start a new order
      </Link>
    </main>
  );
}
