import { NextResponse } from "next/server";
import { currentVersion, hydrateOrders } from "@/lib/store";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Takes the browser's cached orders and puts back anything this process is
 * missing. Deployed serverless, each instance starts with an empty store, so
 * without this a payment link opened seconds after it was generated 404s.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { orders?: Order[] };
    const restored = hydrateOrders(Array.isArray(body.orders) ? body.orders : []);
    return NextResponse.json({ restored, version: currentVersion() });
  } catch {
    return NextResponse.json({ error: "Could not hydrate orders" }, { status: 400 });
  }
}
