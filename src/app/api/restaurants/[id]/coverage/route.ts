import { NextResponse } from "next/server";
import { coverageFor, StoreError } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Category B needs a partner rider in every area a restaurant delivers to. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    return NextResponse.json({ coverage: coverageFor(id) });
  } catch (err) {
    if (err instanceof StoreError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not check coverage" }, { status: 400 });
  }
}
