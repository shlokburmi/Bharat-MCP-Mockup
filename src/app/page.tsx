import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import FeatureSections from "@/components/ui/feature-sections";
import FeatureHighlights from "@/components/ui/feature-highlights";

const SURFACES = [
  {
    href: "/chat",
    title: "Assistant chat",
    who: "Customer",
    detail:
      "Search restaurants, pick dishes, get a payment link — the demo opener.",
    emoji: "✦",
  },
  {
    href: "/restaurant",
    title: "Restaurant interface",
    who: "Owner",
    detail: "Incoming orders, accept or reject, preparing and ready.",
    emoji: "🧑‍🍳",
  },
  {
    href: "/rider",
    title: "Delivery partner",
    who: "Rider",
    detail: "Assigned jobs, mark picked up and delivered.",
    emoji: "🛵",
  },
  {
    href: "/admin",
    title: "Ops console",
    who: "Internal",
    detail: "Onboard restaurants, build menus, Category A/B, test orders.",
    emoji: "🎛️",
  },
];

export default function Home() {
  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-xl bg-brand text-white"
          >
            ॐ
          </span>
          <div>
            <h1 className="text-lg font-semibold">Bharat MCP</h1>
            <p className="text-sm text-muted-foreground">
              Food ordering through an assistant · mockup
            </p>
          </div>
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
          Five surfaces, one order. Every screen reads the same in-memory store
          on the server, so an order paid in one tab shows up in the others
          within a couple of seconds. Start in the assistant chat — the
          customer&apos;s order link is created from there.
        </p>

        <ul className="mt-6 space-y-2">
          {SURFACES.map((s) => (
            <li
              key={s.title}
              className="rounded-2xl border border-border bg-card transition-colors hover:border-muted-foreground/30"
            >
              <Link href={s.href} className="flex items-start gap-3 p-4">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-lg"
                >
                  {s.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold">{s.title}</span>
                    <Badge variant="secondary">{s.who}</Badge>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {s.detail}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-xs text-muted-foreground">
          No real payments, restaurants or riders are involved. Orders live in
          the server process and reset when it restarts, or from the ops
          console.
        </p>
      </main>

      {/* Wider than the surface list above so the feature grid can sit
          three-across on desktop rather than stacking. */}
      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="border-t border-border" />
        <FeatureSections />
        <FeatureHighlights />
      </div>
    </>
  );
}
