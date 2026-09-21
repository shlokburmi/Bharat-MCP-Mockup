import { NextResponse } from "next/server";
import { IllegalTransitionError } from "@/lib/state-machine";
import { assignRider, currentVersion, getOrder, StoreError, transitionOrder } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const order = getOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ version: currentVersion(), order });
}

interface PatchBody {
  /** omit to apply the other fields (rider assignment, ETA) without moving
   *  the order — claiming a job is not a status change */
  status?: OrderStatus;
  actor?: "customer" | "system" | "restaurant" | "rider" | "ops";
  note?: string;
  /** set when the restaurant declines */
  rejectionReason?: string;
  /** minutes from now; the restaurant promises this on accept */
  etaMins?: number;
  /** Category B: attach a partner rider before moving to picked_up */
  assignRiderId?: string;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as PatchBody;
    if (body.assignRiderId !== undefined) assignRider(id, body.assignRiderId || undefined);

    const patch: Partial<Order> = {};
    if (body.rejectionReason) patch.rejectionReason = body.rejectionReason;
    if (body.etaMins) patch.etaAt = new Date(Date.now() + body.etaMins * 60_000).toISOString();

    if (!body.status) {
      const current = getOrder(id);
      if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ version: currentVersion(), order: current });
    }

    const order = transitionOrder(id, body.status, {
      actor: body.actor ?? "system",
      note: body.note,
      patch,
    });
    return NextResponse.json({ version: currentVersion(), order });
  } catch (err) {
    if (err instanceof IllegalTransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not update order" }, { status: 400 });
  }
}
