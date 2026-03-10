import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  const cleaned = username.toLowerCase().trim();

  if (!/^[a-z0-9_]{3,30}$/.test(cleaned)) {
    return NextResponse.json({ available: false, error: "Invalid format" });
  }

  const existing = await prisma.user.findUnique({
    where: { username: cleaned },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
