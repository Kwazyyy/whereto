import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function priceLevelToPrice(level: number | null): string {
    if (!level) return "$";
    return "$".repeat(Math.min(level, 4));
}

// POST /api/recommendations
// Body: { receiverId, googlePlaceId, note? }
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const senderId = session.user.id;
    const { receiverId, googlePlaceId, note } = await req.json() as {
        receiverId: string;
        googlePlaceId: string;
        note?: string;
    };

    if (!receiverId || !googlePlaceId) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (receiverId === senderId) {
        return NextResponse.json({ error: "Cannot recommend to yourself" }, { status: 400 });
    }

    // Verify they are friends
    const friendship = await prisma.friendship.findFirst({
        where: {
            status: "accepted",
            OR: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        },
    });

    if (!friendship) {
        return NextResponse.json({ error: "Not friends" }, { status: 403 });
    }

    // Find the place
    const place = await prisma.place.findUnique({
        where: { googlePlaceId },
    });

    if (!place) {
        return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const rec = await prisma.recommendation.create({
        data: {
            senderId,
            receiverId,
            placeId: place.id,
            note: note?.trim() || null,
        },
    });

    return NextResponse.json({ recommendationId: rec.id }, { status: 201 });
}

// GET /api/recommendations
// ?all=true returns all received recs (seen + unseen) — used for Missed Recs
// default returns only unseen
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("all") === "true";

    const recs = await prisma.recommendation.findMany({
        where: {
            receiverId: session.user.id,
            ...(showAll ? {} : { seen: false }),
        },
        include: {
            sender: { select: { id: true, name: true, image: true } },
            place: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const result = recs.map((r) => ({
        recommendationId: r.id,
        note: r.note,
        seen: r.seen,
        createdAt: r.createdAt.toISOString(),
        sender: { name: r.sender.name, image: r.sender.image },
        place: {
            placeId: r.place.googlePlaceId,
            name: r.place.name,
            address: r.place.address,
            location: { lat: r.place.lat, lng: r.place.lng },
            price: priceLevelToPrice(r.place.priceLevel),
            rating: r.place.rating ?? 0,
            photoRef: r.place.photoUrl,
            photoRefs: r.place.photoUrl ? [r.place.photoUrl] : [],
            type: r.place.placeType,
            openNow: false,
            hours: [] as string[],
            distance: "",
            tags: (r.place.vibeTags as string[]) ?? [],
        },
    }));

    return NextResponse.json(result);
}

// PATCH /api/recommendations
// Body: { ids: string[] } — mark recommendations as seen
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await req.json() as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Missing ids" }, { status: 400 });
    }

    await prisma.recommendation.updateMany({
        where: { id: { in: ids }, receiverId: session.user.id },
        data: { seen: true },
    });

    return NextResponse.json({ ok: true });
}
