import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  haversineKm,
  calculateMatchScore,
  INTENT_TO_TAG,
  generateDisplayTags,
} from "@/lib/recommendation";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const intent = searchParams.get("intent") ?? "coffee";
  const lat = parseFloat(searchParams.get("lat") ?? "43.6532");
  const lng = parseFloat(searchParams.get("lng") ?? "-79.3832");

  // Accept "distance" (km) or legacy "radius" (meters)
  const distanceParam = searchParams.get("distance");
  const radiusParam = searchParams.get("radius");
  let maxDistKm: number | null = null;
  if (distanceParam) {
    const d = parseFloat(distanceParam);
    maxDistKm = d === 0 ? null : d;
  } else if (radiusParam) {
    const r = parseInt(radiusParam, 10);
    maxDistKm = r === 0 ? null : r / 1000;
  }

  const priceLevelParam = searchParams.get("priceLevel");
  const priceFilter =
    priceLevelParam && priceLevelParam !== "all"
      ? parseInt(priceLevelParam, 10)
      : null;

  const intentTag = INTENT_TO_TAG[intent] ?? "coffee";

  try {
    // Single query: all places with save counts + approved photo counts
    const allPlaces = await prisma.place.findMany({
      select: {
        id: true,
        googlePlaceId: true,
        name: true,
        lat: true,
        lng: true,
        address: true,
        placeType: true,
        priceLevel: true,
        rating: true,
        photoUrl: true,
        vibeTags: true,
        _count: {
          select: {
            saves: true,
            photos: { where: { status: "approved" } },
          },
        },
      },
    });

    // Filter by vibeTag matching the intent
    let filtered = allPlaces.filter((p) => {
      const tags = p.vibeTags;
      if (!tags || !Array.isArray(tags)) return false;
      return (tags as string[]).includes(intentTag);
    });

    // Filter by priceLevel
    if (priceFilter !== null) {
      filtered = filtered.filter(
        (p) => p.priceLevel !== null && p.priceLevel <= priceFilter
      );
    }

    // Calculate distance for each place
    const withDistance = filtered.map((p) => ({
      ...p,
      distKm: haversineKm(lat, lng, p.lat, p.lng),
    }));

    // Filter by max distance (null = no limit / "All Toronto")
    const inRange =
      maxDistKm !== null
        ? withDistance.filter((p) => p.distKm <= maxDistKm!)
        : withDistance;

    // Max saves for popularity normalization
    const maxSaves = Math.max(1, ...inRange.map((p) => p._count.saves));

    // Score each place
    const scored = inRange.map((p) => {
      const vibeTags = Array.isArray(p.vibeTags)
        ? (p.vibeTags as string[])
        : [];
      return {
        ...p,
        vibeTagsArr: vibeTags,
        matchScore: calculateMatchScore({
          rating: p.rating,
          distKm: p.distKm,
          tagCount: vibeTags.length,
          saveCount: p._count.saves,
          maxSaves,
        }),
      };
    });

    // Sort by score descending, limit to 50
    scored.sort((a, b) => b.matchScore - a.matchScore);
    const results = scored.slice(0, 50);

    // Build response
    const places = results.map((p) => ({
      id: p.id,
      googlePlaceId: p.googlePlaceId,
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      rating: p.rating ?? 0,
      priceLevel: p.priceLevel,
      photoUrl: p.photoUrl ?? null,
      placeType: p.placeType,
      vibeTags: p.vibeTagsArr,
      distance: Math.round(p.distKm * 100) / 100,
      matchScore: p.matchScore,
      displayTags: generateDisplayTags(p.vibeTagsArr, intentTag),
      communityPhotoCount: p._count.photos,
      menuUrl: `https://www.google.com/search?q=${encodeURIComponent(
        p.name + " " + p.address + " menu"
      )}`,
      menuType: "search" as const,
      savedByFriends: [] as string[],
    }));

    return NextResponse.json({ places });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch places", details: String(err) },
      { status: 500 }
    );
  }
}
