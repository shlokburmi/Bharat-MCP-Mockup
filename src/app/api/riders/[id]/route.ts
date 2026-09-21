import { NextResponse } from "next/server";
import { setRiderOnline, StoreError } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const { online } = (await req.json()) as { online: boolean };
    return NextResponse.json({ rider: setRiderOnline(id, online) });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not update rider" }, { status: 400 });
  }
}
