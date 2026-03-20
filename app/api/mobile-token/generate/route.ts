import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/auth", process.env.NEXT_PUBLIC_NEXTAUTH_URL ?? "https://savrd.ca")
    );
  }

  // Generate short-lived token
  const token = crypto.randomUUID();
  
  // Clear any existing tokens to avoid collisions
  await prisma.mobileAuthToken.deleteMany({
    where: {
      OR: [
        { userId: session.user.id },
        { expiresAt: { lt: new Date() } },
      ],
    },
  });

  await prisma.mobileAuthToken.create({
    data: {
      token,
      userId: session.user.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

  // Server-side redirect triggers iOS to prompt/auto-open the custom scheme,
  // bypassing the JavaScript strict user-gesture requirement.
  return new NextResponse(null, {
    status: 302,
    headers: { Location: "savrd://auth-done" },
  });
}
