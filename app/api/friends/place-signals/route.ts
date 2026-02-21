import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/friends/place-signals
// Body: { placeIds: string[] }  (Google Place IDs from the current swipe deck)
// Returns a map of { [googlePlaceId]: { userId, name, image }[] }
// Only returns data for the current user's accepted friends.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({});
  }

  const { placeIds } = await req.json() as { placeIds: string[] };
  if (!Array.isArray(placeIds) || placeIds.length === 0) {
    return NextResponse.json({});
  }

  const userId = session.user.id;

  // Get accepted friends
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  });

  if (friendships.length === 0) return NextResponse.json({});

  const friendIds = friendships.map((f) =>
    f.senderId === userId ? f.receiverId : f.senderId
  );

  // Find saves by friends for the given place IDs
  const saves = await prisma.save.findMany({
    where: {
      userId: { in: friendIds },
      place: { googlePlaceId: { in: placeIds } },
    },
    include: {
      user:  { select: { id: true, name: true, image: true } },
      place: { select: { googlePlaceId: true } },
    },
  });

  // Group by Google Place ID
  const signals: Record<string, { userId: string; name: string | null; image: string | null }[]> = {};
  for (const save of saves) {
    const gid = save.place.googlePlaceId;
    if (!signals[gid]) signals[gid] = [];
    signals[gid].push({ userId: save.user.id, name: save.user.name, image: save.user.image });
  }

  return NextResponse.json(signals);
}
