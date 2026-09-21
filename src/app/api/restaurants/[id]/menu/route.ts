import { NextResponse } from "next/server";
import { addMenuItems, getMenu, StoreError } from "@/lib/store";
import type { NewMenuItem } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ menu: getMenu(id) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const { items } = (await req.json()) as { items: NewMenuItem[] };
    return NextResponse.json({ items: addMenuItems(id, items) }, { status: 201 });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not add menu items" }, { status: 400 });
  }
}
