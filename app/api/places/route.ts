import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  haversineKm,
  calculateMatchScore,
  INTENT_TO_TAG,
  generateDisplayTags,
  generateDisplayTagsMulti,
} from "@/lib/recommendation";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Multi-intent: "intents=romantic,chill" or single "intent=romantic"
  const intentsParam = searchParams.get("intents");
  const intentParam = searchParams.get("intent") ?? "coffee";
  const intentKeys = intentsParam
    ? intentsParam.split(",").filter(Boolean)
    : [intentParam];

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

  // Map intent keys to vibe tags (deduplicate)
  const intentTags = [...new Set(intentKeys.map((k) => INTENT_TO_TAG[k] ?? k))];
  const isMulti = intentTags.length > 1;

  try {
    // Exclude places the user has already saved
    const session = await auth();
    let excludedPlaceIds: string[] = [];
    if (session?.user?.id) {
      const userSaves = await prisma.save.findMany({
        where: { userId: session.user.id },
        select: { placeId: true },
      });
      excludedPlaceIds = userSaves.map((s) => s.placeId);
    }

    // Single query: all places with save counts + approved photo counts
    const allPlaces = await prisma.place.findMany({
      where: excludedPlaceIds.length > 0
        ? { NOT: { id: { in: excludedPlaceIds } } }
        : undefined,
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

    // Filter: place must match at least 1 of the selected tags
    let filtered = allPlaces.filter((p) => {
      const tags = p.vibeTags;
      if (!tags || !Array.isArray(tags)) return false;
      const vt = tags as string[];
      return intentTags.some((t) => vt.includes(t));
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

    // Score each place with match tier info
    const scored = inRange.map((p) => {
      const vibeTags = Array.isArray(p.vibeTags)
        ? (p.vibeTags as string[])
        : [];
      const matchedCount = intentTags.filter((t) => vibeTags.includes(t)).length;
      const matchTier: "full" | "partial" =
        matchedCount === intentTags.length ? "full" : "partial";

      return {
        ...p,
        vibeTagsArr: vibeTags,
        matchedCount,
        matchTier,
        matchScore: calculateMatchScore({
          rating: p.rating,
          distKm: p.distKm,
          tagCount: vibeTags.length,
          saveCount: p._count.saves,
          maxSaves,
          matchedTagCount: matchedCount,
          totalSelectedTags: intentTags.length,
        }),
      };
    });

    // Sort: full matches first (by score), then partial matches (by score)
    scored.sort((a, b) => {
      if (a.matchTier !== b.matchTier) {
        return a.matchTier === "full" ? -1 : 1;
      }
      return b.matchScore - a.matchScore;
    });

    const results = scored.slice(0, 50);

    // Build response
    const primaryTag = intentTags[0];
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
      matchTier: p.matchTier,
      displayTags: isMulti
        ? generateDisplayTagsMulti(p.vibeTagsArr, intentTags)
        : generateDisplayTags(p.vibeTagsArr, primaryTag),
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
