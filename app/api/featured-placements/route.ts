import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const distance = searchParams.get("distance");

  if (!intent) {
    return NextResponse.json(
      { error: "intent is required" },
      { status: 400 }
    );
  }

  // Resolve intent: accept both IDs ("trending") and labels ("Trending Now")
  const intentLabel = INTENT_ID_TO_LABEL[intent] ?? intent;

  const now = new Date();

  // Fetch all active placements — filter intents in JS since it's a JSON column
  const placements = await prisma.featuredPlacement.findMany({
    where: {
      status: "active",
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: {
      place: true,
    },
    orderBy: { priority: "desc" },
  });

  // Filter by intent match (intents is a JSON array of labels)
  const intentMatches = placements.filter((p) => {
    const intents = p.intents as string[];
    return Array.isArray(intents) && intents.includes(intentLabel);
  });

  // Filter by distance if provided
  let filtered = intentMatches;
  if (
    distance &&
    distance !== "0" &&
    !isNaN(lat) &&
    !isNaN(lng)
  ) {
    const radiusKm = parseInt(distance, 10) / 1000;
    filtered = intentMatches.filter((p) => {
      if (p.place.lat == null || p.place.lng == null) return false;
      return haversineKm(lat, lng, p.place.lat, p.place.lng) <= radiusKm;
    });
  }

  if (filtered.length === 0) {
    return NextResponse.json({ placement: null });
  }

  // Pick top priority; if tied, pick random among ties
  const topPriority = filtered[0].priority;
  const topTier = filtered.filter((p) => p.priority === topPriority);
  const winner = topTier[Math.floor(Math.random() * topTier.length)];

  // Extract Google photo reference from stored photoUrl
  // photoUrl format: https://places.googleapis.com/v1/places/.../photos/.../media?...
  // photoRef format needed: places/.../photos/...
  let photoRef: string | null = null;
  if (winner.place.photoUrl) {
    const match = winner.place.photoUrl.match(/(places\/[^/]+\/photos\/[^/]+)/);
    if (match) photoRef = match[1];
  }

  return NextResponse.json({
    placement: {
      placementId: winner.id,
      featured: true,
      googlePlaceId: winner.googlePlaceId,
      name: winner.place.name,
      photoRef,
      rating: winner.place.rating,
      lat: winner.place.lat,
      lng: winner.place.lng,
      address: winner.place.address,
      priceLevel: winner.place.priceLevel,
      placeType: winner.place.placeType,
      vibeTags: winner.place.vibeTags,
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
  const { googlePlaceId, intents, priority, startDate, endDate } = body;

  if (!googlePlaceId || !intents || !Array.isArray(intents)) {
    return NextResponse.json(
      { error: "googlePlaceId and intents[] are required" },
      { status: 400 }
    );
  }

  // Validate place exists
  const place = await prisma.place.findUnique({
    where: { googlePlaceId },
  });

  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  const placement = await prisma.featuredPlacement.create({
    data: {
      googlePlaceId,
      businessUserId: session.user.id,
      intents,
      priority: priority ?? 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  });

  return NextResponse.json({ placement }, { status: 201 });
}
