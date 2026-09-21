"use client";

import { Badge, Card, VegDot } from "@/components/ui/kit";
import { rupees } from "@/lib/format";
import type { Order } from "@/lib/types";

export function ItemsList({ order }: { order: Order }) {
  return (
    <ul className="divide-y divide-line">
      {order.items.map((item) => (
        <li key={item.menuItemId} className="flex items-start gap-3 py-3">
          <span aria-hidden className="text-xl leading-6">
            {item.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <VegDot veg={item.veg} />
              <span className="truncate text-[15px] font-medium text-ink">{item.name}</span>
            </div>
            <div className="text-sm text-ink-faint">
              {item.qty} × {rupees(item.price)}
              {item.notes && <span className="italic"> · {item.notes}</span>}
            </div>
          </div>
          <span className="shrink-0 text-[15px] font-medium tabular-nums text-ink">
            {rupees(item.price * item.qty)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function BillRow({
  label,
  value,
  strong = false,
  muted = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "flex items-baseline justify-between pt-3 text-base font-semibold text-ink"
          : `flex items-baseline justify-between text-sm ${muted ? "text-ink-faint" : "text-ink-soft"}`
      }
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function BillBreakdown({ order }: { order: Order }) {
  const { totals } = order;
  return (
    <div className="space-y-2">
      <BillRow label="Item total" value={rupees(totals.subtotal)} />
      {order.mode === "delivery" ? (
        <BillRow label="Delivery fee" value={rupees(totals.deliveryFee)} />
      ) : (
        <BillRow label="Pickup — no delivery fee" value="₹0" muted />
      )}
      <BillRow label="Taxes" value={rupees(totals.taxes)} />
      <BillRow label="Platform fee" value={rupees(totals.platformFee)} />
      {totals.discount > 0 && (
        <BillRow label="Discount" value={`- ${rupees(totals.discount)}`} />
      )}
      <div className="border-t border-line">
        <BillRow label="Total" value={rupees(totals.total)} strong />
      </div>
    </div>
  );
}

export function RestaurantHeader({ order }: { order: Order }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-canvas text-xl"
      >
        {order.items[0]?.emoji ?? "🍽️"}
      </span>
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-semibold text-ink">{order.restaurantName}</h2>
        <p className="text-sm text-ink-faint">
          {order.mode === "pickup" ? "Pickup order" : `Delivery to ${order.customer.area}`} ·{" "}
          {order.code}
        </p>
      </div>
    </div>
  );
}

export function DeliveryDetails({ order }: { order: Order }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          {order.mode === "pickup" ? "Pickup contact" : "Delivery address"}
        </h3>
        <Badge>{order.mode === "pickup" ? "Collect in store" : order.customer.area}</Badge>
      </div>
      <p className="text-[15px] text-ink">{order.customer.name}</p>
      <p className="text-sm text-ink-soft">{order.customer.phone}</p>
      {order.mode === "delivery" && (
        <p className="mt-1 text-sm text-ink-soft">
          {order.customer.address}
          {order.customer.landmark && <span className="text-ink-faint"> · {order.customer.landmark}</span>}
        </p>
      )}
    </Card>
  );
}

export function PoweredByStrip() {
  return (
    <p className="pt-2 text-center text-xs text-ink-faint">
      Ordered through your assistant · Bharat MCP
    </p>
  );
}
