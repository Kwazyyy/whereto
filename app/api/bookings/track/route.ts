import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.googlePlaceId || !body?.platform) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  console.log("[booking-click]", {
    googlePlaceId: body.googlePlaceId,
    platform: body.platform,
    userId: body.userId ?? null,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
