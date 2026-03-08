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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  console.log("[featured/GET] userId:", session.user.id, "role:", session.user.role);

  const [placements, claims] = await Promise.all([
    prisma.featuredPlacement.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.businessClaim.findMany({
      where: { userId: session.user.id, status: "approved" },
      select: { googlePlaceId: true, businessName: true },
    }),
  ]);

  console.log("[featured/GET] placements:", placements.length, "claimedPlaces:", claims.length, "claims:", JSON.stringify(claims));

  return NextResponse.json({
    placements,
    claimedPlaces: claims,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { googlePlaceId, businessName, intents, startDate, endDate } = body;

  // Validate required fields
  if (!googlePlaceId || !businessName || !intents || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required fields: googlePlaceId, businessName, intents, startDate, endDate" },
      { status: 400 }
    );
  }

  // Validate intents
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

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return NextResponse.json({ error: "startDate must be today or in the future" }, { status: 400 });
  }

  if (end <= start) {
    return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
  }

  // Validate business claim ownership
  const claim = await prisma.businessClaim.findFirst({
    where: {
      userId: session.user.id,
      googlePlaceId,
      status: "approved",
    },
  });

  if (!claim) {
    return NextResponse.json(
      { error: "You do not have an approved claim for this place" },
      { status: 403 }
    );
  }

  // Check for overlapping active placement
  const overlap = await prisma.featuredPlacement.findFirst({
    where: {
      googlePlaceId,
      status: "active",
      startDate: { lt: end },
      endDate: { gt: start },
    },
  });

  if (overlap) {
    return NextResponse.json(
      { error: "An active featured placement already exists for this place during the selected dates" },
      { status: 409 }
    );
  }

  const placement = await prisma.featuredPlacement.create({
    data: {
      googlePlaceId,
      businessName,
      userId: session.user.id,
      intents,
      startDate: start,
      endDate: end,
      status: "active",
    },
  });

  return NextResponse.json({ placement }, { status: 201 });
}
