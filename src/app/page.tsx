import Link from "next/link";
import { Badge } from "@/components/ui/kit";

const SURFACES = [
  {
    href: "/chat",
    title: "Assistant chat",
    who: "Customer",
    detail: "Search restaurants, pick dishes, get a payment link — the demo opener.",
    emoji: "✦",
    big: true,
  },
  {
    href: "/restaurant",
    title: "Restaurant interface",
    who: "Owner",
    detail: "Incoming orders, accept or reject, preparing and ready.",
    emoji: "🧑‍🍳",
    big: false,
  },
  {
    href: "/rider",
    title: "Delivery partner",
    who: "Rider",
    detail: "Assigned jobs, mark picked up and delivered.",
    emoji: "🛵",
    big: false,
  },
  {
    href: "/admin",
    title: "Ops console",
    who: "Internal",
    detail: "Onboard restaurants, build menus, Category A/B, test orders.",
    emoji: "🎛️",
    big: false,
  },
];

const INTRO_STRIP = [
  {
    icon: "💬",
    text: "An order starts in a chat — no app to install, no menu to browse alone.",
  },
  {
    icon: "⚡",
    text: "The restaurant sees a paid order the instant it lands, over what looks like WhatsApp.",
  },
  {
    icon: "📍",
    text: "One link carries the customer from payment straight through to delivered.",
  },
];

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      {/* ---------------------------------------------------------- header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="shadow-soft grid size-8 place-items-center rounded-xl bg-brand text-sm font-semibold text-white"
          >
            B
          </span>
          <span className="text-[15px] font-semibold text-ink">Bharat MCP</span>
        </div>
        <Link
          href="/chat"
          className="hover-float shadow-soft inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-medium text-white"
        >
          Open assistant
        </Link>
      </header>

      {/* ------------------------------------------------------------ hero */}
      <section className="bg-dots relative overflow-hidden border-b border-line/70">
        <div className="mx-auto w-full max-w-4xl px-5 pt-14 pb-16 text-center sm:px-8 sm:pt-20 sm:pb-24">
          <div className="mb-6 flex justify-center">
            <span
              aria-hidden
              className="animate-float-slow shadow-float grid size-14 place-items-center rounded-2xl bg-surface text-2xl"
              style={{ ["--tilt" as string]: "-6deg" }}
            >
              🍛
            </span>
          </div>

          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl">
            Order, track, and deliver
            <br />
            <span className="text-ink-faint">all from one chat.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-ink-soft sm:text-base">
            A working mockup of food ordering through an AI assistant — search, payment,
            the restaurant&apos;s inbox and a rider&apos;s delivery run, all wired to the
            same order.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/chat"
              className="hover-float inline-flex h-12 items-center rounded-full bg-brand px-7 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(182,58,13,0.15),0_16px_32px_-10px_rgba(214,69,16,0.55)]"
            >
              Try the assistant
            </Link>
            <Link
              href="/admin"
              className="hover-float shadow-soft inline-flex h-12 items-center rounded-full bg-surface px-7 text-[15px] font-medium text-ink"
            >
              Open the ops console
            </Link>
          </div>

          {/* two small "preview" cards, in-flow so they reflow safely on
              narrow screens rather than risking an absolutely-positioned
              scatter layout overflowing the viewport */}
          <div className="mt-14 flex flex-wrap items-start justify-center gap-5">
            <div className="shadow-float hover-float min-w-0 max-w-xs -rotate-2 rounded-2xl bg-surface p-4 text-left">
              <p className="mb-2 text-xs font-medium tracking-wide text-ink-faint uppercase">
                Live tracking
              </p>
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="text-lg">
                  🛵
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">Out for delivery</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                    <div className="h-full w-4/5 rounded-full bg-brand" />
                  </div>
                </div>
              </div>
            </div>

            <div className="shadow-float hover-float min-w-0 max-w-xs rotate-2 rounded-2xl bg-surface p-4 text-left">
              <p className="mb-2 text-xs font-medium tracking-wide text-ink-faint uppercase">
                One order, four screens
              </p>
              <div className="flex gap-1.5">
                {["✦", "🧑‍🍳", "🛵", "🎛️"].map((e) => (
                  <span
                    key={e}
                    aria-hidden
                    className="grid size-8 place-items-center rounded-xl bg-canvas text-sm"
                  >
                    {e}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-ink-soft">Every tab reads the same live order.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- intro strip */}
      <section className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {INTRO_STRIP.map((item) => (
            <div key={item.text} className="border-t border-line pt-5">
              <span aria-hidden className="text-lg">
                {item.icon}
              </span>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- product preview */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8">
        <div className="shadow-float relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-[#8a2e0a] p-6 sm:p-10">
          <div className="mx-auto max-w-xl">
            <div className="shadow-lift overflow-hidden rounded-2xl bg-surface">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <span className="size-2.5 rounded-full bg-bad/60" />
                <span className="size-2.5 rounded-full bg-warn/60" />
                <span className="size-2.5 rounded-full bg-good/60" />
                <span className="ml-2 text-xs text-ink-faint">order/BM-1042</span>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-3 py-2 text-sm text-white">
                    best biryani near Koramangala
                  </p>
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl bg-canvas p-3">
                  <span aria-hidden className="text-lg">
                    🍛
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">Meghana Foods</p>
                    <p className="text-xs text-ink-faint">4.4★ · Andhra, Biryani</p>
                  </div>
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                    Add
                  </span>
                </div>
                <div className="rounded-2xl border border-good/20 bg-good-soft p-3">
                  <p className="text-sm font-semibold text-good">Order confirmed · BM-1042</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                    <div className="h-full w-3/5 rounded-full bg-good" />
                  </div>
                  <p className="mt-1.5 text-xs text-ink-soft">Preparing · 22 min left</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ surfaces bento */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-20 sm:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Five surfaces, one order</h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-soft">
            Every screen reads the same in-memory store, so an order paid in one tab shows up in
            the others within a couple of seconds.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SURFACES.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className={`hover-float shadow-soft hover:shadow-float group flex flex-col justify-between rounded-2xl bg-surface p-5 ${
                s.big ? "sm:col-span-2 sm:flex-row sm:items-center sm:gap-6" : ""
              }`}
            >
              <div className={s.big ? "flex items-center gap-4 sm:flex-1" : ""}>
                <span
                  aria-hidden
                  className={`grid shrink-0 place-items-center rounded-2xl bg-canvas text-xl transition-colors group-hover:bg-brand-soft ${
                    s.big ? "size-14" : "size-11"
                  }`}
                >
                  {s.emoji}
                </span>
                <div className={s.big ? "mt-0 flex-1" : "mt-4"}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-ink">{s.title}</h3>
                    <Badge>{s.who}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{s.detail}</p>
                </div>
              </div>
              {s.big && (
                <span
                  aria-hidden
                  className="hidden shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 sm:block"
                >
                  →
                </span>
              )}
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-ink-faint">
          No real payments, restaurants or riders are involved. Orders live in the server process
          and reset when it restarts, or from the ops console.
        </p>
      </section>
    </main>
  );
}
