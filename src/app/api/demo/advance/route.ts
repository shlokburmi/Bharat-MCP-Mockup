import { NextResponse } from "next/server";
import { nextStatuses } from "@/lib/state-machine";
import { assignRider, currentVersion, getOrder, StoreError, transitionOrder } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Actor that would really have performed each move — Category A restaurants
 *  run their own delivery leg, Category B hands it to a partner rider. */
function actorFor(order: Order, to: OrderStatus): "restaurant" | "rider" | "system" {
  const riderLeg: OrderStatus[] = ["picked_up", "out_for_delivery", "delivered"];
  if (riderLeg.includes(to)) return order.category === "B" ? "rider" : "restaurant";
  if (to === "collected") return "restaurant";
  return "restaurant";
}

/**
 * Demo-only shortcut: nudges an order one step along its happy path so the
 * customer flow can be exercised before the operator screens exist.
 * Never called by production code paths.
 */
export async function POST(req: Request) {
  try {
    const { orderId } = (await req.json()) as { orderId: string };
    const order = getOrder(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const [to] = nextStatuses(order).filter(
      (s) => !["rejected", "cancelled", "payment_failed", "expired"].includes(s),
    );
    if (!to) {
      return NextResponse.json({ version: currentVersion(), order, done: true });
    }

    if (to === "picked_up" && order.category === "B" && !order.riderId) assignRider(order.id);

    const patch: Partial<Order> = {};
    if (to === "accepted" && !order.etaAt) {
      patch.etaAt = new Date(Date.now() + 35 * 60_000).toISOString();
    }

    const updated = transitionOrder(order.id, to, {
      actor: actorFor(order, to),
      note: "Demo advance",
      patch,
    });
    return NextResponse.json({ version: currentVersion(), order: updated });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not advance order" }, { status: 400 });
  }
}
