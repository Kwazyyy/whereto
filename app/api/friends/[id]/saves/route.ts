import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function priceLevelToPrice(level: number | null): string {
  if (!level) return "$";
  return "$".repeat(level);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: friendId } = await params;
  const userId = session.user.id;

  // Verify an accepted friendship exists in either direction
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
  });

  if (!friendship) {
    return NextResponse.json({ error: "Not friends" }, { status: 403 });
  }

  const saves = await prisma.save.findMany({
    where: { userId: friendId },
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
    hours: [] as string[],
    distance: "",
    tags: (s.place.vibeTags as string[]) ?? [],
    intent: s.intent,
    savedAt: s.createdAt.getTime(),
  }));

  return NextResponse.json(result);
}
