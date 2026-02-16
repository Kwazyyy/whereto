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

  const url = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&skipHttpRedirect=true&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to get photo" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ photoUrl: data.photoUri ?? null });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch photo", details: String(err) },
      { status: 500 }
    );
  }
}
