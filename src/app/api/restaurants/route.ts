import { NextResponse } from "next/server";
import { createRestaurant, listRestaurants, search, StoreError, topRestaurants } from "@/lib/store";
import type { CreateRestaurantInput } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const area = searchParams.get("area") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 5);

  if (searchParams.get("all") === "1") {
    return NextResponse.json({ restaurants: listRestaurants() });
  }
  const results = q ? search(q, { area, limit }) : topRestaurants({ area, limit });
  return NextResponse.json({ query: q, area: area ?? null, results });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateRestaurantInput;
    return NextResponse.json({ restaurant: createRestaurant(body) }, { status: 201 });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not create restaurant" }, { status: 400 });
  }
}
