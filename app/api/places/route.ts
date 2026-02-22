import { NextRequest, NextResponse } from "next/server";

const INTENT_QUERIES: Record<string, { primary: string; fallback: string }> = {
  study: { primary: "cafe wifi", fallback: "cafe" },
  date: { primary: "romantic restaurant bar", fallback: "restaurant" },
  trending: { primary: "popular restaurant cafe", fallback: "restaurant cafe" },
  quiet: { primary: "quiet cafe tea", fallback: "cafe" },
  laptop: { primary: "cafe wifi coworking", fallback: "cafe" },
  group: { primary: "restaurant bar group", fallback: "restaurant" },
  budget: { primary: "cheap restaurant cafe", fallback: "restaurant cafe" },
  coffee: { primary: "coffee shop cafe", fallback: "cafe" },
  outdoor: { primary: "patio restaurant outdoor", fallback: "restaurant" },
};

const PRICE_MAP: Record<string, string> = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

interface PlacesPhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

interface PlacesResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  priceLevel?: string;
  rating?: number;
  photos?: PlacesPhoto[];
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  primaryTypeDisplayName?: { text: string };
  types?: string[];
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateTags(place: PlacesResult, intent: string): string[] {
  const tags: string[] = [];
  if (place.rating && place.rating >= 4.5) tags.push("Highly Rated");
  if (place.rating && place.rating >= 4.0 && place.rating < 4.5) tags.push("Popular");
  if (place.currentOpeningHours?.openNow) tags.push("Open Now");

  const intentTags: Record<string, string[]> = {
    study: ["Quiet", "Wifi", "Study Spot"],
    date: ["Romantic", "Cozy", "Aesthetic"],
    trending: ["Trending", "Popular", "Buzzing"],
    quiet: ["Peaceful", "Quiet", "Calm"],
    laptop: ["Wifi", "Outlets", "Work-Friendly"],
    group: ["Spacious", "Group-Friendly", "Lively"],
    budget: ["Affordable", "Budget", "Good Value"],
    coffee: ["Good Coffee", "Cozy", "Chill"],
    outdoor: ["Patio", "Fresh Air", "Scenic"],
  };

  const pool = intentTags[intent] ?? ["Nice Spot"];
  for (const tag of pool) {
    if (tags.length >= 3) break;
    if (!tags.includes(tag)) tags.push(tag);
  }

  return tags.slice(0, 3);
}

const MIN_RESULTS = 5;

async function searchPlaces(
  query: string,
  lat: number,
  lng: number,
  radius: number,
  apiKey: string,
  fieldMask: string
): Promise<PlacesResult[]> {
  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
          },
        },
        maxResultCount: 20,
        languageCode: "en",
      }),
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.places ?? [];
}

function mapAndFilter(
  places: PlacesResult[],
  lat: number,
  lng: number,
  radiusKm: number,
  intent: string
) {
  return places
    .map((place) => {
      const placeLat = place.location?.latitude ?? lat;
      const placeLng = place.location?.longitude ?? lng;
      const distKm = haversineKm(lat, lng, placeLat, placeLng);

      let bestPhotoRef: string | null = null;
      let photoRefs: string[] = [];

      if (place.photos && place.photos.length > 0) {
        interface GooglePhoto {
          widthPx?: number;
          heightPx?: number;
          name: string;
          authorAttributions?: Array<{ displayName: string }>;
        }
        const validPhotos = place.photos.slice(0, 10).filter((p: GooglePhoto) => (p.widthPx || 0) >= 400);

        if (validPhotos.length > 0) {
          const scoredPhotos = validPhotos.map((p: GooglePhoto, index: number) => {
            let score = p.widthPx || 0;

            // If multiple photos are available, Google's 1st photo is often a bad exterior shot
            if (index === 0) {
              score += validPhotos.length >= 3 ? -10000 : 10000;
            }

            // Indices 1-3 are usually the best interior/food shots
            if (index >= 1 && index <= 3) {
              score += 20000;
            }

            // Prefer landscape
            if ((p.widthPx || 0) > (p.heightPx || 0)) {
              score += 5000;
            }

            // Prefer owner uploads (often professional shots without attributions or with business name)
            const isOwner = !p.authorAttributions || p.authorAttributions.length === 0 ||
              p.authorAttributions.some((attr: { displayName: string }) => attr.displayName === place.displayName?.text);
            if (isOwner) {
              score += 30000;
            }

            return { name: p.name, score };
          });

          // Sort descending by score
          scoredPhotos.sort((a: { name: string; score: number }, b: { name: string; score: number }) => b.score - a.score);
          bestPhotoRef = scoredPhotos[0].name;
          // Put the better ones first in the carousel order
          photoRefs = scoredPhotos.map((p: { name: string; score: number }) => p.name);
        } else {
          photoRefs = place.photos.slice(0, 10).map((p: GooglePhoto) => p.name);
          bestPhotoRef = photoRefs[0] ?? null;
        }
      }

      return {
        placeId: place.id,
        name: place.displayName?.text ?? "Unknown",
        address: place.formattedAddress ?? "",
        location: { lat: placeLat, lng: placeLng },
        price: PRICE_MAP[place.priceLevel ?? ""] ?? "$$",
        rating: place.rating ?? 0,
        photoRef: bestPhotoRef,
        photoRefs: photoRefs,
        type: place.primaryTypeDisplayName?.text ?? "Café",
        openNow: place.currentOpeningHours?.openNow ?? false,
        hours: place.currentOpeningHours?.weekdayDescriptions ?? [],
        distKm,
        distance: distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`,
        tags: generateTags(place, intent),
      };
    })
    .filter((p) => p.distKm <= radiusKm)
    .sort((a, b) => a.distKm - b.distKm);
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const intent = searchParams.get("intent") ?? "coffee";
  const lat = parseFloat(searchParams.get("lat") ?? "43.6532");
  const lng = parseFloat(searchParams.get("lng") ?? "-79.3832");
  const radius = Math.min(Math.max(parseInt(searchParams.get("radius") ?? "5000", 10), 500), 50000);
  const radiusKm = radius / 1000;

  const queries = INTENT_QUERIES[intent] ?? INTENT_QUERIES.coffee;

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.priceLevel",
    "places.rating",
    "places.photos",
    "places.currentOpeningHours",
    "places.primaryTypeDisplayName",
    "places.types",
  ].join(",");

  try {
    // Primary search
    const primaryRaw = await searchPlaces(queries.primary, lat, lng, radius, apiKey, fieldMask);
    const results = mapAndFilter(primaryRaw, lat, lng, radiusKm, intent);

    // Fallback if too few results
    if (results.length < MIN_RESULTS) {
      const fallbackRaw = await searchPlaces(queries.fallback, lat, lng, radius, apiKey, fieldMask);
      const fallbackResults = mapAndFilter(fallbackRaw, lat, lng, radiusKm, intent);

      // Merge, deduplicate by placeId
      const seen = new Set(results.map((r) => r.placeId));
      for (const place of fallbackResults) {
        if (!seen.has(place.placeId)) {
          results.push(place);
          seen.add(place.placeId);
        }
      }
      results.sort((a, b) => a.distKm - b.distKm);
    }

    const final = results
      .slice(0, 10)
      .map((place) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { distKm, ...rest } = place;
        return rest;
      });

    return NextResponse.json({ places: final });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch places", details: String(err) },
      { status: 500 }
    );
  }
}
