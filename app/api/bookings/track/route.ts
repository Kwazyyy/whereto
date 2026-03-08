import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.googlePlaceId || !body?.platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await auth().catch(() => null);
    const userId = session?.user?.id ?? body.userId ?? null;

    await prisma.bookingClick.create({
      data: {
        googlePlaceId: body.googlePlaceId,
        platform: body.platform,
        userId,
        source: body.source ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    // Tracking should never break the UX
    return NextResponse.json({ success: true });
  }
}
