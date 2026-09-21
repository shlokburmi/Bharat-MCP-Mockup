import { NextResponse } from "next/server";
import { listRiders } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ riders: listRiders() });
}
