import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing photo reference" }, { status: 400 });
  }

  // Seed scripts store full URLs; extract the resource name if ref is already a full URL
  let photoResource = ref;
  if (ref.startsWith("https://places.googleapis.com/v1/")) {
    const match = ref.match(/\/v1\/(places\/[^/]+\/photos\/[^/]+)/);
    if (match) {
      photoResource = match[1];
    }
  }

  const url = `https://places.googleapis.com/v1/${photoResource}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to get photo" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(
      { photoUrl: data.photoUri ?? null },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
          "CDN-Cache-Control": "public, max-age=86400",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch photo", details: String(err) },
      { status: 500 }
    );
  }
}
