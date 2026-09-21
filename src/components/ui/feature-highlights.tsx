import Image from "next/image";
import { cn } from "@/lib/utils";

interface Highlight {
  title: string;
  description: string;
  color: "violet" | "green" | "orange";
  path: string;
}

const COLOR_CLASSES: Record<
  Highlight["color"],
  { wrap: string; stroke: string }
> = {
  violet: { wrap: "bg-violet-100 border border-violet-200", stroke: "#7F22FE" },
  green: { wrap: "", stroke: "#00A63E" },
  orange: { wrap: "", stroke: "#F54900" },
};

const HIGHLIGHTS: Highlight[] = [
  {
    title: "Live order tracking",
    description:
      "The customer's link updates as the restaurant and rider act — no refresh needed.",
    color: "violet",
    path: "M14 18.667V24.5m4.668-8.167V24.5m4.664-12.833V24.5m2.333-21L15.578 13.587a.584.584 0 0 1-.826 0l-3.84-3.84a.583.583 0 0 0-.825 0L2.332 17.5M4.668 21v3.5m4.664-8.167V24.5",
  },
  {
    title: "Secure mock payments",
    description:
      "A Razorpay-style checkout with UPI, card and cash on delivery, fully simulated.",
    color: "green",
    path: "M14 11.667A2.333 2.333 0 0 0 11.667 14c0 1.19-.117 2.929-.304 4.667m4.972-3.36c0 2.776 0 7.443-1.167 10.36m5.004-1.144c.14-.7.502-2.683.583-3.523M2.332 14a11.667 11.667 0 0 1 21-7m-21 11.667h.01m23.092 0c.233-2.333.152-6.246 0-7",
    // second path segment for this glyph, appended below
  },
  {
    title: "Menu builder for restaurants",
    description:
      "Scan a menu photo into structured items, or add them by hand — from the ops console.",
    color: "orange",
    path: "M4.668 25.666h16.333a2.333 2.333 0 0 0 2.334-2.333V8.166L17.5 2.333H7a2.333 2.333 0 0 0-2.333 2.333v4.667",
  },
];

const EXTRA_PATH: Partial<Record<Highlight["color"], string>> = {
  green:
    "M5.832 22.75C6.415 21 6.999 17.5 6.999 14a7 7 0 0 1 .396-2.333m2.695 13.999c.245-.77.525-1.54.665-2.333m-.255-15.4A7 7 0 0 1 21 14v2.333",
  orange:
    "M16.332 2.333V7a2.334 2.334 0 0 0 2.333 2.333h4.667m-21 8.167h11.667M10.5 21l3.5-3.5-3.5-3.5",
};

/** Detail breakout used alongside FeatureSections — one screenshot, three
 *  capability callouts with the first one highlighted. */
export default function FeatureHighlights() {
  return (
    <div className="flex flex-col items-center justify-center md:flex-row">
      {/* min-w-0 matters here: a flex item with an intrinsically-sized <img>
          otherwise refuses to shrink below that width and overflows the
          viewport on mobile, regardless of w-full. */}
      <Image
        className="h-auto w-full min-w-0 max-w-2xl"
        src="https://cdn.21st.dev/assets/mirror/88/88deec6dabac7248aee51a88cdf51e97f6156a8524fdd2073b5942edcd49385b.png"
        alt=""
        width={672}
        height={504}
        unoptimized
      />
      <div className="space-y-6 px-4 md:px-0">
        {HIGHLIGHTS.map((h) => (
          <div
            key={h.title}
            className={cn(
              "flex max-w-md items-center justify-center gap-6 rounded-xl py-4 pr-4",
              COLOR_CLASSES[h.color].wrap,
            )}
          >
            <div className="aspect-square p-6">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={h.path}
                  stroke={COLOR_CLASSES[h.color].stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {EXTRA_PATH[h.color] && (
                  <path
                    d={EXTRA_PATH[h.color]}
                    stroke={COLOR_CLASSES[h.color].stroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                {h.title}
              </h3>
              <p className="text-sm text-muted-foreground">{h.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
