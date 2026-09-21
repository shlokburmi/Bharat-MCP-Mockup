import { NextResponse } from "next/server";
import { createOrder, getMenu, getRestaurant, payOrder, StoreError } from "@/lib/store";
import { assignRider } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * "Run a test order" from the ops console. Builds the cheapest basket that
 * clears the restaurant's minimum, pays it, and drops it straight into the
 * owner's inbox so they can see what a real order looks like.
 */
export async function POST(req: Request) {
  try {
    const { restaurantId, mode = "delivery" } = (await req.json()) as {
      restaurantId: string;
      mode?: "delivery" | "pickup";
    };
    const restaurant = getRestaurant(restaurantId);
    if (!restaurant) return NextResponse.json({ error: "Unknown restaurant" }, { status: 404 });

    const available = getMenu(restaurantId)
      .filter((m) => m.available)
      .sort((a, b) => b.price - a.price);
    if (!available.length) {
      return NextResponse.json({ error: "This restaurant has no available items" }, { status: 400 });
    }

    const items: { menuItemId: string; qty: number }[] = [];
    let subtotal = 0;
    for (const item of available) {
      if (subtotal >= restaurant.minOrder) break;
      const qty = Math.max(1, Math.ceil((restaurant.minOrder - subtotal) / item.price));
      items.push({ menuItemId: item.id, qty: Math.min(qty, 5) });
      subtotal += item.price * Math.min(qty, 5);
    }

    const usePickup = mode === "pickup" && restaurant.supportsPickup;
    const order = createOrder({
      restaurantId,
      items,
      mode: usePickup ? "pickup" : "delivery",
      customer: {
        name: "Test Customer",
        phone: "+91 90000 00000",
        address: usePickup ? "" : "1, Test Address, Ground Floor",
        area: restaurant.deliversTo[0] ?? restaurant.area,
        landmark: "Ops console test order",
      },
      source: "ops_test",
    });

    const paid = payOrder(order.id, "upi");
    if (paid.category === "B" && paid.mode === "delivery") {
      try {
        return NextResponse.json({ order: assignRider(paid.id) }, { status: 201 });
      } catch {
        // no rider online; ops will see the coverage warning anyway
      }
    }
    return NextResponse.json({ order: paid }, { status: 201 });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not run a test order" }, { status: 400 });
  }
}
