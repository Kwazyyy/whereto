import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import crypto from "crypto";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

/**
 * POST /api/mobile-token
 *
 * Called by SFSafariViewController after a successful OAuth login.
 * The session cookie is present, so we can verify the user and create
 * a short-lived token to be consumed by the native WebView.
 */
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete stale tokens for this user
  await prisma.mobileAuthToken.deleteMany({
    where: {
      OR: [
        { userId: session.user.id },
        { expiresAt: { lt: new Date() } },
      ],
    },
  });

  const token = crypto.randomUUID();
  await prisma.mobileAuthToken.create({
    data: {
      token,
      userId: session.user.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

  return NextResponse.json({ success: true });
}

/**
 * GET /api/mobile-token
 *
 * Called by the Capacitor WebView after SFSafariViewController closes.
 * Finds the latest valid token, consumes it, and manually encodes
 * a NextAuth JWT session cookie, setting it on the response.
 */
export async function GET() {
  const tokenRecord = await prisma.mobileAuthToken.findFirst({
    where: {
      expiresAt: { gt: new Date() },
      createdAt: { gt: new Date(Date.now() - 60_000) }, // created in last 60s
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, email: true, name: true, image: true, role: true }
      }
    }
  });

  if (!tokenRecord) {
    return NextResponse.json({ token: null, error: "No valid token found" }, { status: 404 });
  }

  // Consume token
  await prisma.mobileAuthToken.delete({ where: { id: tokenRecord.id } });

  const user = tokenRecord.user;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    console.error("[Savrd] Missing AUTH_SECRET for manual JWT encoding");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // NextAuth v5 cookie naming convention
  const useSecureCookies = process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https://");
  const cookieName = useSecureCookies ? "__Secure-authjs.session-token" : "authjs.session-token";

  // Create the JWT token
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  const tokenValue = await encode({
    token: {
      name: user.name,
      email: user.email,
      picture: user.image,
      sub: user.id,
      id: user.id,
      role: user.role,
    },
    secret,
    salt: cookieName,
  });

  // Set the cookie
  (await cookies()).set(cookieName, tokenValue, {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
}
