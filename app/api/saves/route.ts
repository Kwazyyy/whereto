import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Place } from "@/lib/types";

function priceToPriceLevel(price: string): number | null {
  if (!price) return null;
  return price.length; // "$" → 1, "$$" → 2, etc.
}

function priceLevelToPrice(level: number | null): string {
  if (!level) return "$";
  return "$".repeat(level);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      place: Place;
      intent: string;
      action: "save" | "go_now";
    };

    const { place, intent, action } = body;

    // Upsert the Place record
    const dbPlace = await prisma.place.upsert({
      where: { googlePlaceId: place.placeId },
      update: {
        name: place.name,
        lat: place.location.lat,
        lng: place.location.lng,
        address: place.address,
        placeType: place.type,
        priceLevel: priceToPriceLevel(place.price),
        rating: place.rating,
        photoUrl: place.photoRef,
        vibeTags: place.tags,
      },
      create: {
        googlePlaceId: place.placeId,
        name: place.name,
        lat: place.location.lat,
        lng: place.location.lng,
        address: place.address,
        placeType: place.type,
        priceLevel: priceToPriceLevel(place.price),
        rating: place.rating,
        photoUrl: place.photoRef,
        vibeTags: place.tags,
      },
    });

    // Upsert the Save record
    const save = await prisma.save.upsert({
      where: {
        userId_placeId: {
          userId: session.user.id,
          placeId: dbPlace.id,
        },
      },
      update: { intent, action },
      create: {
        userId: session.user.id,
        placeId: dbPlace.id,
        intent,
        action,
      },
    });

    return NextResponse.json({ saveId: save.id });
  } catch (err) {
    console.error("POST /api/saves Failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const saves = await prisma.save.findMany({
      where: { userId: session.user.id },
      include: { place: true },
      orderBy: { createdAt: "desc" },
    });

    const result = saves.map((s) => ({
      saveId: s.id,
      placeId: s.place.googlePlaceId,
      name: s.place.name,
      address: s.place.address,
      location: { lat: s.place.lat, lng: s.place.lng },
      price: priceLevelToPrice(s.place.priceLevel),
      rating: s.place.rating ?? 0,
      photoRef: s.place.photoUrl,
      type: s.place.placeType,
      openNow: false,
      hours: [],
      distance: "",
      tags: (s.place.vibeTags as string[]) ?? [],
      intent: s.intent,
      savedAt: s.createdAt.getTime(),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/saves Failed:", err);
    return NextResponse.json({ error: "Internal Server Error", details: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { saveId } = await req.json() as { saveId: string };

  // Verify ownership
  const save = await prisma.save.findUnique({ where: { id: saveId } });
  if (!save || save.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.save.delete({ where: { id: saveId } });

  return NextResponse.json({ ok: true });
}
