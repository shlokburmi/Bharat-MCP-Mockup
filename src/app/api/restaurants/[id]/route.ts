import { NextResponse } from "next/server";
import { getMenu, getRestaurant, setRestaurantLive, StoreError, updateRestaurant } from "@/lib/store";
import type { Restaurant } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const restaurant = getRestaurant(id);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }
  return NextResponse.json({ restaurant, menu: getMenu(id) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const { live, ...patch } = (await req.json()) as Partial<Restaurant>;
    const updated = Object.keys(patch).length ? updateRestaurant(id, patch) : getRestaurant(id);
    if (!updated) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    return NextResponse.json({
      restaurant: live === undefined ? updated : setRestaurantLive(id, live),
    });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not update restaurant" }, { status: 400 });
  }
}
