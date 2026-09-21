"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Spinner, cx } from "@/components/ui/kit";
import { BillBreakdown, DeliveryDetails, ItemsList, PoweredByStrip, RestaurantHeader } from "./OrderBits";
import { PaymentSheet } from "./PaymentSheet";
import { TrackingView } from "./TrackingView";
import { countdown, rupees, timeOfDay } from "@/lib/format";
import { useLiveOrder, useNow } from "@/lib/use-live-order";
import type { Order } from "@/lib/types";

/**
 * The dynamic link. One URL carries the customer from summary through the
 * payment sheet into live tracking — it never navigates away, so the link a
 * customer keeps in their chat history always shows the current truth.
 */
export function OrderExperience({ initialOrder }: { initialOrder: Order }) {
  const { order, error, apply } = useLiveOrder(initialOrder.id, initialOrder);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [justPaid, setJustPaid] = useState(false);

  if (!order) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6 text-brand" />
      </div>
    );
  }

  const awaitingPayment = order.status === "created" || order.status === "payment_failed";

  return (
    <>
      {error && (
        <p className="mb-3 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
          Reconnecting to live updates…
        </p>
      )}

      {awaitingPayment && (
        <PrePayment
          order={order}
          onPay={() => setSheetOpen(true)}
        />
      )}

      {order.status === "expired" && <ExpiredScreen order={order} />}
      {order.status === "rejected" && <RejectedScreen order={order} />}
      {order.status === "cancelled" && <CancelledScreen order={order} />}

      {!awaitingPayment &&
        !["expired", "rejected", "cancelled"].includes(order.status) && (
          <>
            {justPaid && <PaidToast order={order} onDone={() => setJustPaid(false)} />}
            <TrackingView order={order} live />
          </>
        )}

      <PaymentSheet
        order={order}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPaid={(next) => {
          apply(next);
          setSheetOpen(false);
          setJustPaid(true);
        }}
      />
    </>
  );
}

function PrePayment({ order, onPay }: { order: Order; onPay: () => void }) {
  const now = useNow();
  const remaining = countdown(order.payBy, now);
  const urgent = Date.parse(order.payBy) - now < 5 * 60_000;

  return (
    <div className="space-y-3">
      {order.status === "payment_failed" && (
        <Card className="border-bad/25 bg-bad-soft p-4">
          <p className="text-[15px] font-semibold text-bad">Payment failed</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            Your bank declined the transaction and no money was deducted. You can try again below.
          </p>
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <RestaurantHeader order={order} />
          <Badge tone={urgent ? "bad" : "neutral"} className="shrink-0 tabular-nums">
            {remaining} left
          </Badge>
        </div>
        <div className="border-t border-line">
          <ItemsList order={order} />
        </div>
        <div className="border-t border-line pt-3">
          <BillBreakdown order={order} />
        </div>
      </Card>

      <DeliveryDetails order={order} />

      <Card className="p-4">
        <p className="text-sm text-ink-soft">
          {order.mode === "pickup"
            ? "Collect from the restaurant once it's ready. We'll show you when."
            : `${order.restaurantName} starts cooking as soon as payment goes through.`}
        </p>
      </Card>

      <div className="sticky bottom-3 pt-1">
        <Button size="lg" className="w-full shadow-lg" onClick={onPay}>
          Pay {rupees(order.totals.total)}
        </Button>
        <p className={cx("mt-2 text-center text-xs", urgent ? "text-bad" : "text-ink-faint")}>
          This link is valid until {timeOfDay(order.payBy)}
        </p>
      </div>

      <PoweredByStrip />
    </div>
  );
}

function PaidToast({ order, onDone }: { order: Order; onDone: () => void }) {
  return (
    <Card className="animate-rise mb-3 flex items-center gap-3 border-good/30 bg-good-soft p-4">
      <span aria-hidden className="text-xl">
        ✅
      </span>
      <div className="flex-1">
        <p className="text-[15px] font-semibold text-good">
          {order.paymentMethod === "cod" ? "Order confirmed" : "Payment successful"}
        </p>
        <p className="text-sm text-ink-soft">
          {rupees(order.totals.total)}
          {order.paymentId && ` · ${order.paymentId}`}
        </p>
      </div>
      <button
        type="button"
        onClick={onDone}
        aria-label="Dismiss"
        className="text-ink-faint hover:text-ink"
      >
        ✕
      </button>
    </Card>
  );
}

function DeadEnd({
  emoji,
  title,
  body,
  children,
}: {
  emoji: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Card className="px-5 py-10 text-center">
        <span aria-hidden className="text-4xl">
          {emoji}
        </span>
        <h1 className="mt-3 text-xl font-semibold text-ink">{title}</h1>
        <p className="mx-auto mt-1 max-w-xs text-sm text-ink-soft">{body}</p>
        {children}
        <Link
          href="/chat"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 font-medium text-white hover:bg-brand-dark"
        >
          Start a new order
        </Link>
      </Card>
      <PoweredByStrip />
    </div>
  );
}

function ExpiredScreen({ order }: { order: Order }) {
  return (
    <DeadEnd
      emoji="⌛"
      title="This link has expired"
      body={`Payment links stay open for 30 minutes so restaurants get orders they can actually cook. Ask your assistant for ${order.restaurantName} again and you'll get a fresh link.`}
    />
  );
}

function RejectedScreen({ order }: { order: Order }) {
  const refundable = order.paymentMethod && order.paymentMethod !== "cod";
  return (
    <DeadEnd
      emoji="🙁"
      title="The restaurant couldn't take this order"
      body={
        order.rejectionReason
          ? `${order.restaurantName} said: "${order.rejectionReason}"`
          : `${order.restaurantName} declined the order.`
      }
    >
      <div className="mx-auto mt-5 max-w-xs rounded-xl bg-canvas px-4 py-3 text-left">
        <p className="text-sm font-semibold text-ink">
          {refundable ? "Refund of " : "Nothing charged — "}
          {refundable && <span className="tabular-nums">{rupees(order.totals.total)}</span>}
        </p>
        <p className="mt-0.5 text-sm text-ink-soft">
          {refundable
            ? `Initiated to your ${order.paymentMethod?.toUpperCase()} account. Banks usually take 3–5 working days.`
            : "This was a cash order, so there is nothing to refund."}
        </p>
      </div>
    </DeadEnd>
  );
}

function CancelledScreen({ order }: { order: Order }) {
  return (
    <DeadEnd
      emoji="🚫"
      title="Order cancelled"
      body={`Order ${order.code} was cancelled. If you were charged, the refund is on its way.`}
    />
  );
}
