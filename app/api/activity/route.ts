import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

function priceLevelToPrice(level: number | null): string {
    if (!level) return "$";
    return "$".repeat(Math.min(level, 4));
}

// GET /api/activity
// Returns a combined, sorted feed of:
//   - recent saves from accepted friends (last 30 days)
//   - recommendations sent to the current user (last 30 days)
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const since = THIRTY_DAYS_AGO();

    // Get all accepted friends
    const friendships = await prisma.friendship.findMany({
        where: {
            status: "accepted",
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        select: { senderId: true, receiverId: true },
    });

    const friendIds = friendships.map((f) =>
        f.senderId === userId ? f.receiverId : f.senderId
    );

    if (friendIds.length === 0) {
        return NextResponse.json([]);
    }

    // Fetch friend saves (excluding recs_from_friends board saves to avoid duplication)
    const friendSaves = await prisma.save.findMany({
        where: {
            userId: { in: friendIds },
            createdAt: { gte: since },
            intent: { not: "recs_from_friends" },
        },
        include: {
            user: { select: { id: true, name: true, image: true } },
            place: true,
        },
        orderBy: { createdAt: "desc" },
        take: 40,
    });

    // Fetch recommendations sent TO the current user
    const receivedRecs = await prisma.recommendation.findMany({
        where: {
            receiverId: userId,
            createdAt: { gte: since },
        },
        include: {
            sender: { select: { id: true, name: true, image: true } },
            place: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    // Shape into unified ActivityItem format
    type ActivityItem = {
        id: string;
        type: "save" | "recommendation";
        actorName: string | null;
        actorImage: string | null;
        actorId: string;
        place: {
            placeId: string;
            name: string;
            address: string;
            location: { lat: number; lng: number };
            price: string;
            rating: number;
            photoRef: string | null;
            type: string;
            tags: string[];
            openNow: boolean;
            hours: string[];
            distance: string;
        };
        intent?: string;
        note?: string | null;
        createdAt: string;
    };

    const saveItems: ActivityItem[] = friendSaves.map((s) => ({
        id: `save_${s.id}`,
        type: "save",
        actorName: s.user.name,
        actorImage: s.user.image,
        actorId: s.user.id,
        place: {
            placeId: s.place.googlePlaceId,
            name: s.place.name,
            address: s.place.address,
            location: { lat: s.place.lat, lng: s.place.lng },
            price: priceLevelToPrice(s.place.priceLevel),
            rating: s.place.rating ?? 0,
            photoRef: s.place.photoUrl,
            type: s.place.placeType,
            tags: (s.place.vibeTags as string[]) ?? [],
            openNow: false,
            hours: [],
            distance: "",
        },
        intent: s.intent,
        createdAt: s.createdAt.toISOString(),
    }));

    const recItems: ActivityItem[] = receivedRecs.map((r) => ({
        id: `rec_${r.id}`,
        type: "recommendation",
        actorName: r.sender.name,
        actorImage: r.sender.image,
        actorId: r.sender.id,
        place: {
            placeId: r.place.googlePlaceId,
            name: r.place.name,
            address: r.place.address,
            location: { lat: r.place.lat, lng: r.place.lng },
            price: priceLevelToPrice(r.place.priceLevel),
            rating: r.place.rating ?? 0,
            photoRef: r.place.photoUrl,
            type: r.place.placeType,
            tags: (r.place.vibeTags as string[]) ?? [],
            openNow: false,
            hours: [],
            distance: "",
        },
        note: r.note,
        createdAt: r.createdAt.toISOString(),
    }));

    // Merge and sort by most recent, dedupe by place+actor for saves
    const seen = new Set<string>();
    const all = [...saveItems, ...recItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter((item) => {
            const key = `${item.type}_${item.actorId}_${item.place.placeId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 50);

    return NextResponse.json(all);
}
