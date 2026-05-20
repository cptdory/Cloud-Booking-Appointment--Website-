import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getSession();

  return NextResponse.json({
    user: session?.user ?? null,
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
