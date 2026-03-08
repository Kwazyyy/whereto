import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Map intent IDs (sent by frontend) to display labels (stored in DB)
const INTENT_ID_TO_LABEL: Record<string, string> = {
  study: "Study/Work",
  date: "Date/Chill",
  trending: "Trending Now",
  quiet: "Quiet Cafes",
  laptop: "Laptop-Friendly",
  group: "Group Hangouts",
  budget: "Budget Eats",
  desserts: "Desserts",
  coffee: "Coffee & Catch-Up",
  outdoor: "Outdoor/Patio",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const intent = searchParams.get("intent");

  if (!intent) {
    return NextResponse.json(
      { error: "intent is required" },
      { status: 400 }
    );
  }

  // Resolve intent: accept both IDs ("trending") and labels ("Trending Now")
  const intentLabel = INTENT_ID_TO_LABEL[intent] ?? intent;

  const now = new Date();

  // Fetch all active placements that are currently within their date range
  const placements = await prisma.featuredPlacement.findMany({
    where: {
      status: "active",
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by intent match (intents is a JSON array of labels)
  const intentMatches = placements.filter((p) => {
    const intents = p.intents as string[];
    return Array.isArray(intents) && intents.includes(intentLabel);
  });

  if (intentMatches.length === 0) {
    return NextResponse.json({ placement: null });
  }

  // Pick random among matches
  const winner = intentMatches[Math.floor(Math.random() * intentMatches.length)];

  // Enrich with Place data from DB
  const dbPlace = await prisma.place.findUnique({
    where: { googlePlaceId: winner.googlePlaceId },
  });

  const vibeTags = dbPlace && Array.isArray(dbPlace.vibeTags) ? (dbPlace.vibeTags as string[]) : [];

  return NextResponse.json({
    placement: {
      placementId: winner.id,
      featured: true,
      googlePlaceId: winner.googlePlaceId,
      name: dbPlace?.name ?? winner.businessName,
      address: dbPlace?.address ?? "",
      lat: dbPlace?.lat ?? null,
      lng: dbPlace?.lng ?? null,
      rating: dbPlace?.rating ?? null,
      photoRef: dbPlace?.photoUrl ?? null,
      priceLevel: dbPlace?.priceLevel ?? null,
      placeType: dbPlace?.placeType ?? "restaurant",
      vibeTags,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin" && user?.role !== "business") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { googlePlaceId, businessName, intents, startDate, endDate } = body;

  if (!googlePlaceId || !businessName || !intents || !Array.isArray(intents) || !startDate || !endDate) {
    return NextResponse.json(
      { error: "googlePlaceId, businessName, intents[], startDate, and endDate are required" },
      { status: 400 }
    );
  }

  const placement = await prisma.featuredPlacement.create({
    data: {
      googlePlaceId,
      businessName,
      userId: session.user.id,
      intents,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  return NextResponse.json({ placement }, { status: 201 });
}
