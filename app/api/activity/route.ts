import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

function priceLevelToPrice(level: number | null): string {
    if (!level) return "$";
    return "$".repeat(Math.min(level, 4));
}

type PlaceShape = {
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

export type FeedItem =
    | {
        id: string;
        type: "save_group";
        actorName: string | null;
        actorImage: string | null;
        actorId: string;
        /** Most recent save in this group */
        createdAt: string;
        /** Day label: ISO date string YYYY-MM-DD in actor's UTC day */
        day: string;
        places: PlaceShape[];
    }
    | {
        id: string;
        type: "recommendation";
        actorName: string | null;
        actorImage: string | null;
        actorId: string;
        place: PlaceShape;
        note: string | null;
        createdAt: string;
    };

// GET /api/activity?since=<isoTimestamp>
// Returns grouped activity feed.
// Saves are grouped by actor + UTC day; recommendations are ungrouped.
// Limit: 25 items total.
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const since = THIRTY_DAYS_AGO();

    // --- Friends ---
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

    if (friendIds.length === 0) return NextResponse.json([]);

    // --- Friend saves ---
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
        take: 200, // fetch many so grouping can reduce to 25
    });

    // --- Recommendations sent TO current user ---
    const receivedRecs = await prisma.recommendation.findMany({
        where: { receiverId: userId, createdAt: { gte: since } },
        include: {
            sender: { select: { id: true, name: true, image: true } },
            place: true,
        },
        orderBy: { createdAt: "desc" },
        take: 25,
    });

    // --- Group saves by actor + UTC day ---
    const groupMap = new Map<string, {
        actorName: string | null;
        actorImage: string | null;
        actorId: string;
        day: string;
        latestAt: string;
        places: PlaceShape[];
        seenPlaceIds: Set<string>;
    }>();

    for (const s of friendSaves) {
        const day = s.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
        const key = `${s.user.id}_${day}`;
        let group = groupMap.get(key);
        if (!group) {
            group = {
                actorName: s.user.name,
                actorImage: s.user.image,
                actorId: s.user.id,
                day,
                latestAt: s.createdAt.toISOString(),
                places: [],
                seenPlaceIds: new Set(),
            };
            groupMap.set(key, group);
        }
        // Deduplicate places within same group
        if (!group.seenPlaceIds.has(s.place.googlePlaceId)) {
            group.seenPlaceIds.add(s.place.googlePlaceId);
            group.places.push({
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
            });
        }
        // Keep latest timestamp
        if (s.createdAt.toISOString() > group.latestAt) {
            group.latestAt = s.createdAt.toISOString();
        }
    }

    const saveGroups: FeedItem[] = Array.from(groupMap.entries()).map(([key, g]) => ({
        id: `save_group_${key}`,
        type: "save_group",
        actorName: g.actorName,
        actorImage: g.actorImage,
        actorId: g.actorId,
        createdAt: g.latestAt,
        day: g.day,
        places: g.places,
    }));

    // --- Recommendation items ---
    const recItems: FeedItem[] = receivedRecs.map((r) => ({
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

    // Merge, sort newest first, limit to 25
    const feed = [...saveGroups, ...recItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 25);

    return NextResponse.json(feed);
}
