/**
 * SHARED CONTRACT — the single source of truth for how an order may move.
 * Every surface (customer link, restaurant, rider, ops) transitions through
 * `canTransition` / `applyTransition`. Nothing sets `order.status` directly.
 */
import type { FulfilmentMode, Order, OrderEvent, OrderStatus } from "./types";

type Actor = OrderEvent["actor"];

/** Legal next statuses, keyed by current status. Mode-specific edges are
 *  filtered by `nextStatuses`, which knows delivery vs pickup. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ["paid", "payment_failed", "expired", "cancelled"],
  payment_failed: ["paid", "expired", "cancelled"],
  expired: [],
  paid: ["sent_to_restaurant"],
  sent_to_restaurant: ["accepted", "rejected"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready"],
  // delivery -> picked_up, pickup -> collected
  ready: ["picked_up", "collected"],
  picked_up: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  collected: [],
  rejected: [],
  cancelled: [],
};

/** Statuses that end the order's life. */
export const TERMINAL_STATUSES: OrderStatus[] = [
  "delivered",
  "collected",
  "rejected",
  "cancelled",
  "expired",
];

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** The happy path the customer's tracking timeline renders, per mode. */
export function happyPath(mode: FulfilmentMode): OrderStatus[] {
  return mode === "pickup"
    ? ["paid", "sent_to_restaurant", "accepted", "preparing", "ready", "collected"]
    : [
        "paid",
        "sent_to_restaurant",
        "accepted",
        "preparing",
        "ready",
        "picked_up",
        "out_for_delivery",
        "delivered",
      ];
}

export function nextStatuses(order: Order): OrderStatus[] {
  const raw = TRANSITIONS[order.status] ?? [];
  if (order.status !== "ready") return raw;
  return order.mode === "pickup"
    ? raw.filter((s) => s !== "picked_up")
    : raw.filter((s) => s !== "collected");
}

export function canTransition(order: Order, to: OrderStatus): boolean {
  return nextStatuses(order).includes(to);
}

export class IllegalTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Illegal transition: ${from} -> ${to}`);
    this.name = "IllegalTransitionError";
  }
}

/** Returns a NEW order with the transition applied and the timeline appended.
 *  Throws IllegalTransitionError if the move is not legal for this order. */
export function applyTransition(
  order: Order,
  to: OrderStatus,
  opts: { actor: Actor; note?: string; patch?: Partial<Order> } = { actor: "system" },
): Order {
  if (!canTransition(order, to)) throw new IllegalTransitionError(order.status, to);
  const at = new Date().toISOString();
  return {
    ...order,
    ...opts.patch,
    status: to,
    updatedAt: at,
    timeline: [...order.timeline, { status: to, at, actor: opts.actor, note: opts.note }],
  };
}

/** Copy shown to the customer. Deliberately category-agnostic: a Cat A order
 *  and a Cat B order read identically on the tracking screen. */
export const CUSTOMER_STATUS_COPY: Record<OrderStatus, { title: string; detail: string }> = {
  created: { title: "Awaiting payment", detail: "Complete payment to place your order" },
  payment_failed: { title: "Payment failed", detail: "No money was deducted. Try again." },
  expired: { title: "Link expired", detail: "This payment link is no longer valid" },
  paid: { title: "Payment received", detail: "Sending your order to the restaurant" },
  sent_to_restaurant: { title: "Sent to restaurant", detail: "Waiting for them to confirm" },
  accepted: { title: "Order confirmed", detail: "The restaurant has accepted your order" },
  rejected: { title: "Order declined", detail: "The restaurant could not take this order" },
  preparing: { title: "Being prepared", detail: "Your food is being cooked fresh" },
  ready: { title: "Ready", detail: "Packed and ready to go" },
  picked_up: { title: "Picked up", detail: "Your order has left the restaurant" },
  out_for_delivery: { title: "Out for delivery", detail: "On the way to you" },
  delivered: { title: "Delivered", detail: "Enjoy your meal" },
  collected: { title: "Collected", detail: "Thanks for picking up" },
  cancelled: { title: "Cancelled", detail: "This order was cancelled" },
};

/** Copy for the operator surfaces (restaurant / rider / ops). */
export const OPERATOR_STATUS_COPY: Record<OrderStatus, string> = {
  created: "Unpaid",
  payment_failed: "Payment failed",
  expired: "Expired",
  paid: "Paid",
  sent_to_restaurant: "New order",
  accepted: "Accepted",
  rejected: "Rejected",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  collected: "Collected",
  cancelled: "Cancelled",
};
