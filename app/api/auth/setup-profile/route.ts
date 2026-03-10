import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username, vibePreferences, hasCompletedOnboarding } = await req.json();

    const data: Record<string, unknown> = {};

    if (username !== undefined) {
      const cleaned = username.toLowerCase().trim();
      if (!/^[a-z0-9_]{3,30}$/.test(cleaned)) {
        return NextResponse.json({ error: "Invalid username format" }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({
        where: { username: cleaned },
        select: { id: true },
      });

      if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }

      data.username = cleaned;
    }

    if (vibePreferences !== undefined) {
      data.vibePreferences = vibePreferences;
    }

    if (hasCompletedOnboarding !== undefined) {
      data.hasCompletedOnboarding = hasCompletedOnboarding;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
