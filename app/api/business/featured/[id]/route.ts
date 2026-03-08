import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_INTENTS = [
  "study_work",
  "date_chill",
  "trending",
  "quiet_cafes",
  "laptop_friendly",
  "group_hangouts",
  "budget_eats",
  "coffee_catchup",
  "outdoor_patio",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const placement = await prisma.featuredPlacement.findUnique({
    where: { id },
  });

  if (!placement) {
    return NextResponse.json({ error: "Placement not found" }, { status: 404 });
  }

  if (placement.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (placement.status !== "active") {
    return NextResponse.json(
      { error: "Only active placements can be edited" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { intents, startDate, endDate } = body;

  const data: Record<string, unknown> = {};

  if (intents !== undefined) {
    if (!Array.isArray(intents) || intents.length === 0) {
      return NextResponse.json({ error: "intents must be a non-empty array" }, { status: 400 });
    }
    const invalidIntents = intents.filter((i: string) => !VALID_INTENTS.includes(i));
    if (invalidIntents.length > 0) {
      return NextResponse.json(
        { error: `Invalid intents: ${invalidIntents.join(", ")}` },
        { status: 400 }
      );
    }
    data.intents = intents;
  }

  const newStart = startDate ? new Date(startDate) : placement.startDate;
  const newEnd = endDate ? new Date(endDate) : placement.endDate;

  if (startDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newStart < today) {
      return NextResponse.json({ error: "startDate must be today or in the future" }, { status: 400 });
    }
    data.startDate = newStart;
  }

  if (endDate) {
    if (newEnd <= newStart) {
      return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
    }
    data.endDate = newEnd;
  }

  const updated = await prisma.featuredPlacement.update({
    where: { id },
    data,
  });

  return NextResponse.json({ placement: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const placement = await prisma.featuredPlacement.findUnique({
    where: { id },
  });

  if (!placement) {
    return NextResponse.json({ error: "Placement not found" }, { status: 404 });
  }

  if (placement.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.featuredPlacement.update({
    where: { id },
    data: { status: "revoked" },
  });

  return NextResponse.json({ placement: updated });
}
