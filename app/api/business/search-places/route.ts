import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: "Query too short" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY!;

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.photos,places.types,places.googleMapsUri",
        },
        body: JSON.stringify({
          textQuery: query,
          locationBias: {
            circle: {
              center: { latitude: 43.6532, longitude: -79.3832 },
              radius: 30000,
            },
          },
          includedType: "restaurant",
        }),
      }
    );

    if (!response.ok) {
      console.error("Google Places API error:", response.status, await response.text());
      return NextResponse.json(
        { error: "Failed to search places" },
        { status: 500 }
      );
    }

    const data = (await response.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text: string };
        formattedAddress?: string;
        rating?: number;
        priceLevel?: string;
        photos?: Array<{ name: string }>;
        types?: string[];
        googleMapsUri?: string;
      }>;
    };

    const places = (data.places || []).slice(0, 8).map((place) => ({
      googlePlaceId: place.id,
      name: place.displayName?.text,
      address: place.formattedAddress,
      rating: place.rating || null,
      priceLevel: place.priceLevel || null,
      photoUrl:
        place.photos && place.photos.length > 0
          ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=400&key=${apiKey}`
          : null,
      types: place.types || [],
      googleMapsUrl: place.googleMapsUri || null,
    }));

    return NextResponse.json({ places });
  } catch (error) {
    console.error("Search places error:", error);
    return NextResponse.json(
      { error: "Failed to search places" },
      { status: 500 }
    );
  }
}
