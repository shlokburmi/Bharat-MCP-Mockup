"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, cx } from "@/components/ui/kit";
import { BillBreakdown, DeliveryDetails, ItemsList, PoweredByStrip } from "./OrderBits";
import { rupees, timeOfDay } from "@/lib/format";
import { CUSTOMER_STATUS_COPY, happyPath, isTerminal } from "@/lib/state-machine";
import { useNow } from "@/lib/use-live-order";
import type { Order, OrderStatus } from "@/lib/types";

/**
 * Live tracking. Deliberately identical for Category A and Category B orders:
 * the customer sees the same stages whether the restaurant delivers itself or
 * a partner rider does.
 */

function stageState(stage: OrderStatus, order: Order): "done" | "current" | "pending" {
  const reached = new Set(order.timeline.map((e) => e.status));
  // A finished order has no "current" stage — the last step reads as done.
  if (stage === order.status) return isTerminal(order.status) ? "done" : "current";
  if (reached.has(stage)) return "done";
  return "pending";
}

function reachedAt(stage: OrderStatus, order: Order): string | undefined {
  return order.timeline.find((e) => e.status === stage)?.at;
}

function Timeline({ order }: { order: Order }) {
  const stages = happyPath(order.mode);
  return (
    <ol className="relative">
      {stages.map((stage, i) => {
        const state = stageState(stage, order);
        const copy = CUSTOMER_STATUS_COPY[stage];
        const at = reachedAt(stage, order);
        const last = i === stages.length - 1;
        return (
          <li key={stage} className="flex gap-3 pb-1">
            <div className="flex flex-col items-center">
              <span
                className={cx(
                  "mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 text-[10px] text-white",
                  state === "done" && "border-good bg-good",
                  state === "current" && "animate-pulse-dot border-brand bg-brand",
                  state === "pending" && "border-line-strong bg-surface",
                )}
              >
                {state === "done" ? "✓" : ""}
              </span>
              {!last && (
                <span
                  className={cx(
                    "w-0.5 flex-1",
                    state === "done" ? "bg-good/40" : "bg-line",
                  )}
                />
              )}
            </div>
            <div className={cx("min-w-0 flex-1 pb-5", last && "pb-0")}>
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className={cx(
                    "text-[15px]",
                    state === "pending" ? "text-ink-faint" : "font-medium text-ink",
                  )}
                >
                  {copy.title}
                </p>
                {at && <span className="shrink-0 text-xs text-ink-faint">{timeOfDay(at)}</span>}
              </div>
              {state !== "pending" && (
                <p className="text-sm text-ink-soft">{copy.detail}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Hero({ order }: { order: Order }) {
  const now = useNow(30_000);
  const copy = CUSTOMER_STATUS_COPY[order.status];
  const done = order.status === "delivered" || order.status === "collected";
  const etaMins = order.etaAt
    ? Math.max(0, Math.round((Date.parse(order.etaAt) - now) / 60_000))
    : null;

  return (
    <Card className={cx("overflow-hidden", done && "border-good/30")}>
      <div className={cx("px-5 py-6 text-center", done ? "bg-good-soft" : "bg-brand-soft")}>
        <span aria-hidden className="text-4xl">
          {done ? "🎉" : order.status === "out_for_delivery" ? "🛵" : "👨‍🍳"}
        </span>
        <h1 className={cx("mt-2 text-xl font-semibold", done ? "text-good" : "text-brand")}>
          {copy.title}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">{copy.detail}</p>
        {!done && etaMins !== null && (
          <p className="mt-3 text-sm font-medium text-ink">
            {order.mode === "pickup" ? "Ready in about" : "Arriving in about"}{" "}
            <span className="tabular-nums">{etaMins} min</span>
          </p>
        )}
      </div>
    </Card>
  );
}

function DeliveryPartnerCard({ order }: { order: Order }) {
  const onTheWay = order.status === "picked_up" || order.status === "out_for_delivery";
  if (!onTheWay || order.mode === "pickup") return null;
  // Category A orders are delivered by the restaurant's own staff, so the
  // contact falls back to the restaurant. The customer sees one shape either way.
  const name = order.riderName ?? `${order.restaurantName} delivery`;
  const phone = order.riderPhone;
  return (
    <Card className="flex items-center gap-3 p-4">
      <span aria-hidden className="grid size-11 place-items-center rounded-full bg-canvas text-xl">
        🛵
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-faint">Bringing your order</p>
        <p className="truncate text-[15px] font-medium text-ink">{name}</p>
      </div>
      {phone && (
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="rounded-xl border border-line-strong px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
        >
          Call
        </a>
      )}
    </Card>
  );
}

export function TrackingView({ order, live }: { order: Order; live: boolean }) {
  const router = useRouter();
  const [showBill, setShowBill] = useState(false);
  const settled = isTerminal(order.status);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-ink-faint">
          Order <span className="font-medium text-ink-soft">{order.code}</span>
        </p>
        {live && !settled && (
          <Badge tone="good">
            <span className="animate-pulse-dot size-1.5 rounded-full bg-good" />
            Live
          </Badge>
        )}
      </div>

      <Hero order={order} />
      <DeliveryPartnerCard order={order} />

      <Card className="p-5">
        <Timeline order={order} />
      </Card>

      <Card className="p-4">
        <button
          type="button"
          onClick={() => setShowBill((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold text-ink">
            {order.items.reduce((n, i) => n + i.qty, 0)} items from {order.restaurantName}
          </span>
          <span className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="tabular-nums">{rupees(order.totals.total)}</span>
            <span aria-hidden className={cx("transition-transform", showBill && "rotate-180")}>
              ⌄
            </span>
          </span>
        </button>
        {showBill && (
          <div className="mt-2">
            <ItemsList order={order} />
            <div className="mt-3 border-t border-line pt-3">
              <BillBreakdown order={order} />
            </div>
            {order.paymentMethod && (
              <p className="mt-3 text-xs text-ink-faint">
                {order.paymentMethod === "cod"
                  ? "Cash on delivery"
                  : `Paid via ${order.paymentMethod.toUpperCase()}`}
                {order.paymentId && ` · ${order.paymentId}`}
              </p>
            )}
          </div>
        )}
      </Card>

      <DeliveryDetails order={order} />

      {settled && (
        <Button variant="secondary" className="w-full" onClick={() => router.push("/chat")}>
          Order something else
        </Button>
      )}

      <PoweredByStrip />
    </div>
  );
}
