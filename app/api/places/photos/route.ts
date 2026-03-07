import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const placeId = request.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "photos",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch place" }, { status: res.status });
    }

    const data = await res.json();
    const photoRefs: string[] = (data.photos ?? [])
      .slice(0, 10)
      .map((p: { name: string }) => p.name);

    return NextResponse.json({ photoRefs });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch photos", details: String(err) },
      { status: 500 }
    );
  }
}
