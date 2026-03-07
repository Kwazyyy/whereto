import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { torontoNeighborhoods, getNeighborhoodForPlace } from "@/lib/neighborhoods";
import {
  getRequiredVisits,
  getNeighborhoodStatus,
  toSlug,
} from "@/lib/exploration-challenges";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 1. Fetch all data in parallel (avoids 42+ separate queries) ──
  const [allPlaces, visitCounts, userVisits] = await Promise.all([
    // Every place in the DB with coordinates
    prisma.place.findMany({
      select: {
        id: true,
        googlePlaceId: true,
        name: true,
        lat: true,
        lng: true,
        photoUrl: true,
        rating: true,
      },
    }),

    // Global visit counts per place (all users)
    prisma.visit.groupBy({
      by: ["placeId"],
      _count: { placeId: true },
    }),

    // Current user's visited place IDs
    prisma.visit.findMany({
      where: { userId: session.user.id },
      select: { placeId: true },
      distinct: ["placeId"],
    }),
  ]);

  // ── 2. Build lookup maps ──
  const visitCountMap = new Map<string, number>();
  for (const v of visitCounts) {
    visitCountMap.set(v.placeId, v._count.placeId);
  }

  const userVisitedPlaceIds = new Set(userVisits.map((v) => v.placeId));

  // ── 3. Assign places to neighborhoods ──
  type PlaceWithMeta = (typeof allPlaces)[number] & { globalVisits: number };

  const neighborhoodPlaces = new Map<string, PlaceWithMeta[]>();
  for (const hood of torontoNeighborhoods) {
    neighborhoodPlaces.set(hood.name, []);
  }

  for (const place of allPlaces) {
    if (place.lat == null || place.lng == null) continue;
    const hood = getNeighborhoodForPlace(place.lat, place.lng);
    if (hood) {
      neighborhoodPlaces.get(hood.name)?.push({
        ...place,
        globalVisits: visitCountMap.get(place.id) ?? 0,
      });
    }
  }

  // ── 4. Build response per neighborhood ──
  let totalUnlocked = 0;

  const neighborhoods = torontoNeighborhoods.map((hood) => {
    const places = neighborhoodPlaces.get(hood.name) ?? [];
    const totalPlacesInArea = places.length;
    const requiredVisits = getRequiredVisits(totalPlacesInArea);

    // Sort: most globally visited first, then by rating as tiebreaker
    const sorted = [...places].sort((a, b) => {
      if (b.globalVisits !== a.globalVisits) return b.globalVisits - a.globalVisits;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    // Pick top N challenge places
    const challengePlaces = sorted.slice(0, requiredVisits).map((p) => ({
      id: p.id,
      googlePlaceId: p.googlePlaceId,
      name: p.name,
      photoUrl: p.photoUrl,
      rating: p.rating,
      visited: userVisitedPlaceIds.has(p.id),
    }));

    const visitedCount = challengePlaces.filter((p) => p.visited).length;
    const status = getNeighborhoodStatus(visitedCount, requiredVisits, totalPlacesInArea);

    if (status === "unlocked") totalUnlocked++;

    return {
      id: toSlug(hood.name),
      name: hood.name,
      area: hood.area,
      totalPlacesInArea,
      requiredVisits,
      challengePlaces,
      visitedCount,
      unlocked: status === "unlocked",
      status,
    };
  });

  return NextResponse.json({
    neighborhoods,
    totalUnlocked,
    totalNeighborhoods: torontoNeighborhoods.length,
    overallPercentage:
      torontoNeighborhoods.length > 0
        ? Math.round((totalUnlocked / torontoNeighborhoods.length) * 100)
        : 0,
  });
}
