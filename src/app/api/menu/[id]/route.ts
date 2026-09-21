import { NextResponse } from "next/server";
import { deleteMenuItem, StoreError, updateMenuItem } from "@/lib/store";
import type { MenuItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const patch = (await req.json()) as Partial<MenuItem>;
    return NextResponse.json({ item: updateMenuItem(id, patch) });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not update item" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    deleteMenuItem(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not delete item" }, { status: 400 });
  }
}
