import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch claims without include to avoid implicit transactions on Neon HTTP
    const rawClaims = await prisma.businessClaim.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Fetch related users in a single query
    const userIds = [...new Set(rawClaims.map((c) => c.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const claims = rawClaims.map((claim) => {
      const claimUser = userMap.get(claim.userId);
      return {
        ...claim,
        user: claimUser
          ? { name: claimUser.name, email: claimUser.email }
          : { name: null, email: "" },
      };
    });

    return NextResponse.json({ claims });
  } catch (error) {
    console.error("Admin claims GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    let body: { claimId?: string; status?: string };
    try {
      body = (await req.json()) as { claimId?: string; status?: string };
    } catch (parseErr) {
      console.error("Admin claims PATCH: failed to parse body:", parseErr);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { claimId, status } = body;
    console.log("Admin claims PATCH: claimId =", claimId, "status =", status);

    if (!claimId || !status) {
      return NextResponse.json(
        { error: "claimId and status are required" },
        { status: 400 }
      );
    }

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Update the claim status (no include — avoids implicit transaction on Neon HTTP)
    const updatedClaim = await prisma.businessClaim.update({
      where: { id: claimId },
      data: { status },
    });

    // Fetch the claiming user separately
    const claimUser = await prisma.user.findUnique({
      where: { id: updatedClaim.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    // If approving, upgrade user role to "business" if not already business/admin
    if (status === "approved" && claimUser && claimUser.role === "user") {
      await prisma.user.update({
        where: { id: claimUser.id },
        data: { role: "business" },
      });
    }

    return NextResponse.json({
      success: true,
      claim: {
        ...updatedClaim,
        user: claimUser ? { name: claimUser.name, email: claimUser.email } : null,
      },
    });
  } catch (error) {
    console.error("Admin claims PATCH error:", error);
    const message = error instanceof Error ? error.message : "Failed to update claim";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
