import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { torontoNeighborhoods, getNeighborhoodForPlace } from "@/lib/neighborhoods";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { id: friendId } = await params;

    if (!friendId) {
        return NextResponse.json({ error: "Missing friend ID" }, { status: 400 });
    }

    try {
        // 1. Verify Friendship status to prevent random scraping
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: friendId, status: "accepted" },
                    { senderId: friendId, receiverId: currentUserId, status: "accepted" },
                ],
            },
        });

        if (!friendship) {
            return NextResponse.json({ error: "Not friends" }, { status: 403 });
        }

        // 2. Fetch both users' profiles
        const [currentUser, friendUser] = await Promise.all([
            prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true, image: true } }),
            prisma.user.findUnique({ where: { id: friendId }, select: { name: true, image: true } }),
        ]);

        if (!currentUser || !friendUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 3. Fetch visits
        const [currentUserVisits, friendUserVisits] = await Promise.all([
            prisma.visit.findMany({ where: { userId: currentUserId }, include: { place: true } }),
            prisma.visit.findMany({ where: { userId: friendId }, include: { place: true } })
        ]);

        const TOTAL_NEIGHBORHOODS = torontoNeighborhoods.length;

        // Helper to process arrays into neighborhood data maps
        const processNeighborhoods = (visits: { place: { lat: number, lng: number } }[]) => {
            const map = new Map<string, { name: string; area: string; explored: boolean; visitCount: number }>();

            // prefill map with all available hoods defaulted to false
            torontoNeighborhoods.forEach(hood => {
                map.set(hood.name, { name: hood.name, area: hood.area, explored: false, visitCount: 0 });
            });

            visits.forEach(v => {
                const hood = getNeighborhoodForPlace(v.place.lat, v.place.lng);
                if (hood) {
                    const current = map.get(hood.name)!;
                    current.explored = true;
                    current.visitCount += 1;
                    map.set(hood.name, current);
                }
            });

            return Array.from(map.values());
        };

        const userNeighborhoods = processNeighborhoods(currentUserVisits);
        const friendNeighborhoods = processNeighborhoods(friendUserVisits);

        const userTotalExplored = userNeighborhoods.filter(n => n.explored).length;
        const friendTotalExplored = friendNeighborhoods.filter(n => n.explored).length;

        // 4. Calculate Overlaps for summary section
        let shared = 0;
        let onlyUser = 0;
        let onlyFriend = 0;
        let neither = 0;

        for (let i = 0; i < TOTAL_NEIGHBORHOODS; i++) {
            const uExplored = userNeighborhoods[i].explored;
            const fExplored = friendNeighborhoods[i].explored;

            if (uExplored && fExplored) shared++;
            else if (uExplored && !fExplored) onlyUser++;
            else if (!uExplored && fExplored) onlyFriend++;
            else neither++;
        }

        return NextResponse.json({
            user: {
                name: currentUser.name,
                avatarUrl: currentUser.image,
                visitCount: currentUserVisits.length,
                neighborhoods: userNeighborhoods,
                totalExplored: userTotalExplored,
                percentage: Math.round((userTotalExplored / TOTAL_NEIGHBORHOODS) * 100)
            },
            friend: {
                name: friendUser.name,
                avatarUrl: friendUser.image,
                visitCount: friendUserVisits.length,
                neighborhoods: friendNeighborhoods,
                totalExplored: friendTotalExplored,
                percentage: Math.round((friendTotalExplored / TOTAL_NEIGHBORHOODS) * 100)
            },
            shared,
            onlyUser,
            onlyFriend,
            neither
        });

    } catch (e) {
        console.error("Comparison Error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
