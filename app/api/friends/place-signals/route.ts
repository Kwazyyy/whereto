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

  // Get followed creators
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true }
  });

  const friendIds = friendships.map((f) =>
    f.senderId === userId ? f.receiverId : f.senderId
  );

  const creatorIds = follows.map(f => f.followingId);
  const combinedIds = Array.from(new Set([...friendIds, ...creatorIds]));

  // Find saves by friends OR followed creators for the given place IDs
  const saves = await prisma.save.findMany({
    where: {
      userId: { in: combinedIds },
      place: { googlePlaceId: { in: placeIds } },
    },
    include: {
      user: { select: { id: true, name: true, image: true, isCreator: true } },
      place: { select: { googlePlaceId: true } },
    },
  });

  // Group by Google Place ID
  const signals: Record<string, { friends: Array<{ userId: string; name: string | null; image: string | null }>, creator: { id: string; name: string | null; avatarUrl: string | null } | null }> = {};
  for (const save of saves) {
    const gid = save.place.googlePlaceId;
    if (!signals[gid]) signals[gid] = { friends: [], creator: null };

    if (save.user.isCreator && creatorIds.includes(save.user.id) && !signals[gid].creator) {
      signals[gid].creator = { id: save.user.id, name: save.user.name, avatarUrl: save.user.image };
    } else if (friendIds.includes(save.user.id)) {
      signals[gid].friends.push({ userId: save.user.id, name: save.user.name, image: save.user.image });
    }
  }

  return NextResponse.json(signals);
}
