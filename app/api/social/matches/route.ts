import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = session.user.id;

        // 1. Get user's accepted friendships
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
                status: "ACCEPTED",
            },
        });

        const friendIds = friendships.map((f) =>
            f.user1Id === userId ? f.user2Id : f.user1Id
        );

        if (friendIds.length === 0) {
            return NextResponse.json([]); // No friends, no matches
        }

        // 2. Get user's own saved placeIds
        const userSaves = await prisma.save.findMany({
            where: { userId },
            select: { placeId: true },
        });

        // We only care about placeIds the user has actually saved
        const userPlaceIds = userSaves.map((s) => s.placeId);

        if (userPlaceIds.length === 0) {
            return NextResponse.json([]); // No saves, no matches
        }

        // 3. Find saves by friends for those exact placeIds
        const friendSaves = await prisma.save.findMany({
            where: {
                userId: { in: friendIds },
                placeId: { in: userPlaceIds },
            },
            include: {
                place: true,
                user: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // 4. Deduplicate by placeId and group the friends who saved it
        const matchesMap = new Map<string, { place: any; friends: { id: string; name: string | null; image: string | null }[] }>();

        for (const save of friendSaves) {
            const pid = save.placeId;
            if (!matchesMap.has(pid)) {
                matchesMap.set(pid, { place: save.place, friends: [] });
            }

            const matchEntry = matchesMap.get(pid)!;
            // Ensure we don't add the same friend multiple times per place (shouldn't happen with unique constraints, but safe)
            if (!matchEntry.friends.some(f => f.id === save.user.id)) {
                matchEntry.friends.push(save.user);
            }
        }

        // Convert map to array and return max 10
        const matches = Array.from(matchesMap.values()).slice(0, 10);

        return NextResponse.json(matches);
    } catch (error) {
        console.error("Failed to fetch matches:", error);
        return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
    }
}
