import { NextResponse } from "next/server";
import { currentVersion, resetDb } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Wipes all orders and restores the seed. Backs the demo reset button. */
export async function POST() {
  resetDb();
  return NextResponse.json({ ok: true, version: currentVersion() });
}
