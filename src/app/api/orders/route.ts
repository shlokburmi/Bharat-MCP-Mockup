import { NextResponse } from "next/server";
import { createOrder, currentVersion, listOrders, StoreError } from "@/lib/store";
import type { CreateOrderInput } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const orders = listOrders({
    restaurantId: searchParams.get("restaurantId") ?? undefined,
    riderId: searchParams.get("riderId") ?? undefined,
    active: searchParams.get("active") === "1" ? true : undefined,
    status: status ? (status.split(",") as OrderStatus[]) : undefined,
  });
  return NextResponse.json({ version: currentVersion(), orders });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderInput;
    const order = createOrder(body);
    return NextResponse.json({ version: currentVersion(), order }, { status: 201 });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not create order" }, { status: 400 });
  }
}
