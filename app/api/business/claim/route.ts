import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      googlePlaceId?: string;
      businessName?: string;
      businessEmail?: string;
      businessPhone?: string;
      ownerRole?: string;
    };

    const { googlePlaceId, businessName, businessEmail, businessPhone, ownerRole } = body;

    if (!googlePlaceId || !businessName || !businessEmail || !ownerRole) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!businessEmail.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const validRoles = ["Owner", "Manager", "Marketing Manager", "Other"];
    if (!validRoles.includes(ownerRole)) {
      return NextResponse.json(
        { error: "Invalid owner role" },
        { status: 400 }
      );
    }

    // Check if this business already has an active claim
    const existingClaim = await prisma.businessClaim.findFirst({
      where: {
        googlePlaceId,
        status: { in: ["approved", "pending"] },
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "This business has already been claimed or has a pending claim" },
        { status: 400 }
      );
    }

    // Check if this user already has a claim for this place
    const userClaim = await prisma.businessClaim.findUnique({
      where: {
        userId_googlePlaceId: {
          userId: session.user.id,
          googlePlaceId,
        },
      },
    });

    if (userClaim) {
      return NextResponse.json(
        { error: "You already have a claim for this business" },
        { status: 400 }
      );
    }

    const claim = await prisma.businessClaim.create({
      data: {
        userId: session.user.id,
        googlePlaceId,
        businessName,
        businessEmail,
        businessPhone: businessPhone || null,
        ownerRole,
        status: "pending",
      },
    });

    return NextResponse.json(
      { success: true, claim },
      { status: 201 }
    );
  } catch (error) {
    console.error("Business claim error:", error);
    return NextResponse.json(
      { error: "Failed to submit claim" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const claims = await prisma.businessClaim.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ claims });
  } catch (error) {
    console.error("Fetch claims error:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}
