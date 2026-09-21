import { NextResponse } from "next/server";
import {
  assignRider,
  createOrder,
  currentVersion,
  getMenu,
  getRestaurant,
  listOrders,
  payOrder,
  StoreError,
  transitionOrder,
} from "@/lib/store";
import type { FulfilmentMode, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Phase 5 demo seeding. Plants one order at each interesting point of the
 * journey so every screen has something on it the moment a demo starts —
 * otherwise the restaurant inbox and rider queue both open empty.
 *
 * Built through the real createOrder / payOrder / transitionOrder path, so the
 * seeded orders are indistinguishable from ones placed by hand.
 */
interface Scenario {
  restaurantId: string;
  customer: { name: string; phone: string; address: string; area: string };
  mode: FulfilmentMode;
  /** how far along the happy path to push it */
  upTo: OrderStatus | "unpaid";
}

const SCENARIOS: Scenario[] = [
  {
    // Sitting on the payment screen — open this one to demo the Razorpay sheet.
    restaurantId: "r_truffles",
    customer: { name: "Kabir Menon", phone: "+91 98450 77012", address: "12, 5th Block", area: "Koramangala" },
    mode: "delivery",
    upTo: "unpaid",
  },
  {
    // Fresh in the restaurant inbox, waiting to be accepted.
    restaurantId: "r_meghana",
    customer: { name: "Ananya Rao", phone: "+91 98867 40021", address: "402, Brigade Sunrise", area: "Koramangala" },
    mode: "delivery",
    upTo: "sent_to_restaurant",
  },
  {
    // Category A, mid-kitchen — the restaurant drives its own delivery leg.
    restaurantId: "r_mtr",
    customer: { name: "Ravi Shankar", phone: "+91 90000 11111", address: "12, 4th Main", area: "Jayanagar" },
    mode: "delivery",
    upTo: "preparing",
  },
  {
    // Category B, already with a partner rider — the rider console opens busy.
    restaurantId: "r_empire",
    customer: { name: "Sneha Iyer", phone: "+91 90000 22222", address: "7, Sector 2", area: "HSR Layout" },
    mode: "delivery",
    upTo: "out_for_delivery",
  },
  {
    // A finished pickup order, so the history tabs aren't empty.
    restaurantId: "r_cta",
    customer: { name: "Deepa Nair", phone: "+91 90000 33333", address: "", area: "Malleshwaram" },
    mode: "pickup",
    upTo: "collected",
  },
];

const PATH: OrderStatus[] = [
  "accepted",
  "preparing",
  "ready",
  "picked_up",
  "out_for_delivery",
  "delivered",
];

const PICKUP_PATH: OrderStatus[] = ["accepted", "preparing", "ready", "collected"];

function actorFor(status: OrderStatus, category: "A" | "B"): "restaurant" | "rider" {
  const riderLeg: OrderStatus[] = ["picked_up", "out_for_delivery", "delivered"];
  return riderLeg.includes(status) && category === "B" ? "rider" : "restaurant";
}

/** Cheapest basket that clears the restaurant's minimum. */
function basketFor(restaurantId: string, minOrder: number) {
  const available = getMenu(restaurantId)
    .filter((m) => m.available)
    .sort((a, b) => b.price - a.price);
  const items: { menuItemId: string; qty: number }[] = [];
  let subtotal = 0;
  for (const item of available) {
    if (subtotal >= minOrder) break;
    const qty = Math.min(5, Math.max(1, Math.ceil((minOrder - subtotal) / item.price)));
    items.push({ menuItemId: item.id, qty });
    subtotal += item.price * qty;
  }
  return items;
}

export async function POST() {
  try {
    const created: string[] = [];

    for (const scenario of SCENARIOS) {
      const restaurant = getRestaurant(scenario.restaurantId);
      if (!restaurant) continue;

      const items = basketFor(restaurant.id, restaurant.minOrder);
      if (!items.length) continue;

      const order = createOrder({
        restaurantId: restaurant.id,
        items,
        mode: scenario.mode,
        customer: { ...scenario.customer, landmark: "Seeded demo order" },
        source: "assistant",
      });
      created.push(order.code);

      if (scenario.upTo === "unpaid") continue;

      let current = payOrder(order.id, scenario.mode === "pickup" ? "upi" : "cod");
      if (current.category === "B" && current.mode === "delivery") {
        try {
          current = assignRider(current.id);
        } catch {
          // no rider online; the order still stands
        }
      }
      if (scenario.upTo === "sent_to_restaurant") continue;

      const path = scenario.mode === "pickup" ? PICKUP_PATH : PATH;
      for (const status of path) {
        current = transitionOrder(current.id, status, {
          actor: actorFor(status, current.category),
          note: "Seeded demo order",
          patch: status === "accepted" ? { etaAt: new Date(Date.now() + 35 * 60_000).toISOString() } : {},
        });
        if (status === scenario.upTo) break;
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      total: listOrders().length,
      version: currentVersion(),
    });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not seed the demo" }, { status: 400 });
  }
}
