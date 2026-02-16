import { NextRequest, NextResponse } from "next/server";

const INTENT_QUERIES: Record<string, string> = {
  study: "quiet cafe wifi study",
  date: "romantic restaurant date night",
  trending: "popular cafe trending",
  quiet: "quiet cafe peaceful",
  laptop: "cafe with wifi laptop friendly",
  group: "restaurant for groups large table",
  budget: "cheap eats budget cafe",
  coffee: "coffee shop cafe",
  outdoor: "cafe patio outdoor seating",
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

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const intent = searchParams.get("intent") ?? "coffee";
  const lat = parseFloat(searchParams.get("lat") ?? "43.6532");
  const lng = parseFloat(searchParams.get("lng") ?? "-79.3832");

  const query = INTENT_QUERIES[intent] ?? INTENT_QUERIES.coffee;

  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 3000,
      },
    },
    maxResultCount: 10,
    languageCode: "en",
  };

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
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: "Google Places API error", details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const places: PlacesResult[] = data.places ?? [];

    const results = places.map((place) => {
      const placeLat = place.location?.latitude ?? lat;
      const placeLng = place.location?.longitude ?? lng;
      const distKm = haversineKm(lat, lng, placeLat, placeLng);

      return {
        placeId: place.id,
        name: place.displayName?.text ?? "Unknown",
        address: place.formattedAddress ?? "",
        location: { lat: placeLat, lng: placeLng },
        price: PRICE_MAP[place.priceLevel ?? ""] ?? "$$",
        rating: place.rating ?? 0,
        photoRef: place.photos?.[0]?.name ?? null,
        type: place.primaryTypeDisplayName?.text ?? "Café",
        openNow: place.currentOpeningHours?.openNow ?? false,
        hours: place.currentOpeningHours?.weekdayDescriptions ?? [],
        distance: distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`,
        tags: generateTags(place, intent),
      };
    });

    return NextResponse.json({ places: results });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch places", details: String(err) },
      { status: 500 }
    );
  }
}
