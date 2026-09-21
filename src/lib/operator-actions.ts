/**
 * SHARED CONTRACT — which buttons each operator surface may show.
 *
 * Both the restaurant and the rider screens build their action buttons from
 * here, and every action is checked against the state machine before it is
 * offered. That is what stops a surface from firing a transition the server
 * will reject with a 409.
 *
 * The split that matters: Category A restaurants run their own delivery leg,
 * so the restaurant owns picked_up → out_for_delivery → delivered. Category B
 * hands that leg to a partner rider, so the rider owns it and the restaurant
 * only watches.
 */
import { canTransition } from "./state-machine";
import type { Order, OrderStatus } from "./types";

export interface OperatorAction {
  status: OrderStatus;
  label: string;
  tone: "primary" | "good" | "danger";
  /** the reject flow collects a reason before firing */
  needsReason?: boolean;
}

function legal(order: Order, actions: OperatorAction[]): OperatorAction[] {
  return actions.filter((a) => canTransition(order, a.status));
}

export function restaurantActions(order: Order): OperatorAction[] {
  switch (order.status) {
    case "sent_to_restaurant":
      return legal(order, [
        { status: "accepted", label: "Accept", tone: "good" },
        { status: "rejected", label: "Reject", tone: "danger", needsReason: true },
      ]);
    case "accepted":
      return legal(order, [{ status: "preparing", label: "Start preparing", tone: "primary" }]);
    case "preparing":
      return legal(order, [{ status: "ready", label: "Mark ready", tone: "good" }]);
    case "ready":
      if (order.mode === "pickup") {
        return legal(order, [
          { status: "collected", label: "Customer collected", tone: "good" },
        ]);
      }
      // Category B is the rider's job from here.
      return order.category === "A"
        ? legal(order, [
            { status: "picked_up", label: "Handed to delivery staff", tone: "primary" },
          ])
        : [];
    case "picked_up":
      return order.category === "A"
        ? legal(order, [{ status: "out_for_delivery", label: "Out for delivery", tone: "primary" }])
        : [];
    case "out_for_delivery":
      return order.category === "A"
        ? legal(order, [{ status: "delivered", label: "Mark delivered", tone: "good" }])
        : [];
    default:
      return [];
  }
}

export function riderActions(order: Order): OperatorAction[] {
  if (order.category !== "B" || order.mode !== "delivery") return [];
  switch (order.status) {
    case "ready":
      return legal(order, [{ status: "picked_up", label: "Picked up", tone: "primary" }]);
    case "picked_up":
      return legal(order, [{ status: "out_for_delivery", label: "Start delivery", tone: "primary" }]);
    case "out_for_delivery":
      return legal(order, [{ status: "delivered", label: "Delivered", tone: "good" }]);
    default:
      return [];
  }
}

/** What the restaurant sees instead of buttons while a partner rider has it. */
export function partnerStatusNote(order: Order): string | null {
  if (order.category !== "B" || order.mode !== "delivery") return null;
  switch (order.status) {
    case "ready":
      return order.riderName
        ? `${order.riderName} is on the way to collect this`
        : "Waiting for a delivery partner to be assigned";
    case "picked_up":
      return `${order.riderName ?? "The delivery partner"} has collected this order`;
    case "out_for_delivery":
      return `${order.riderName ?? "The delivery partner"} is delivering it now`;
    default:
      return null;
  }
}

/** Tailwind classes for a status pill, shared by the operator surfaces. */
export const STATUS_PILL: Record<OrderStatus, string> = {
  created: "bg-muted text-muted-foreground",
  payment_failed: "bg-bad-soft text-bad",
  expired: "bg-muted text-muted-foreground",
  paid: "bg-blue-100 text-blue-700",
  sent_to_restaurant: "bg-warn-soft text-warn",
  accepted: "bg-good-soft text-good",
  rejected: "bg-bad-soft text-bad",
  preparing: "bg-brand-soft text-brand",
  ready: "bg-emerald-100 text-emerald-700",
  picked_up: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-indigo-100 text-indigo-700",
  delivered: "bg-good-soft text-good",
  collected: "bg-good-soft text-good",
  cancelled: "bg-muted text-muted-foreground",
};
