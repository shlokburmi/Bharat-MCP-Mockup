import { NextResponse } from "next/server";
import { assignRider, currentVersion, payOrder, StoreError } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Mock Razorpay checkout. The customer UI posts here when the sheet resolves. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as {
      method: PaymentMethod;
      outcome?: "success" | "failure";
      /** instrument the sheet charged, e.g. "HDFC Credit Card •••• 4242" */
      detail?: string;
    };
    const order = payOrder(id, body.method, body.outcome ?? "success", body.detail);

    // Category B orders get a partner rider attached up front so the rider
    // console sees the job as soon as the restaurant accepts.
    if (order.status === "sent_to_restaurant" && order.category === "B" && order.mode === "delivery") {
      try {
        return NextResponse.json({ version: currentVersion(), order: assignRider(id) });
      } catch {
        // no rider online — the order still stands, ops can assign later
      }
    }
    return NextResponse.json({ version: currentVersion(), order });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Payment could not be processed" }, { status: 400 });
  }
}
