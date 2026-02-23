import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Place } from "@/lib/types";

const RECS_INTENT = "recs_from_friends";

function priceToPriceLevel(price: string): number | null {
  if (!price) return null;
  return price.length;
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
      recommendationId?: string;
    };

    const { place, intent, action, recommendationId } = body;

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

    // Save to the original intent board
    const save = await prisma.save.upsert({
      where: {
        userId_placeId_intent: {
          userId: session.user.id,
          placeId: dbPlace.id,
          intent,
        },
      },
      update: { action, recommendationId: recommendationId ?? null },
      create: {
        userId: session.user.id,
        placeId: dbPlace.id,
        intent,
        action,
        recommendationId: recommendationId ?? null,
      },
    });

    // If this came from a recommendation, also save to the special "Recs from Friends" board
    if (recommendationId) {
      await prisma.save.upsert({
        where: {
          userId_placeId_intent: {
            userId: session.user.id,
            placeId: dbPlace.id,
            intent: RECS_INTENT,
          },
        },
        update: { action, recommendationId },
        create: {
          userId: session.user.id,
          placeId: dbPlace.id,
          intent: RECS_INTENT,
          action,
          recommendationId,
        },
      });
    }

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
      include: {
        place: true,
        recommendation: {
          include: {
            sender: { select: { name: true, image: true } },
          },
        },
      },
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
      hours: [] as string[],
      distance: "",
      tags: (s.place.vibeTags as string[]) ?? [],
      intent: s.intent,
      savedAt: s.createdAt.getTime(),
      // Recommendation metadata (only present for recs_from_friends saves)
      recommenderNote: s.recommendation?.note ?? null,
      recommendedByName: s.recommendation?.sender?.name ?? null,
      recommendedByImage: s.recommendation?.sender?.image ?? null,
      recommendedAt: s.recommendation?.createdAt.toISOString() ?? null,
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

  const { placeId } = await req.json() as { placeId: string };

  const dbPlace = await prisma.place.findUnique({ where: { googlePlaceId: placeId } });
  if (!dbPlace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.save.deleteMany({
    where: { userId: session.user.id, placeId: dbPlace.id },
  });

  return NextResponse.json({ ok: true });
}
