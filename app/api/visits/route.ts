import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { haversineMeters } from "@/lib/haversine";
import { checkAndAwardBadges } from "@/lib/checkBadges";

const MAX_DISTANCE_METERS = 200;

function priceLevelToPrice(level: number | null): string {
    if (!level) return "$";
    return "$".repeat(Math.min(level, 4));
}

// GET /api/visits — returns all visits for the current user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const visits = await prisma.visit.findMany({
        where: { userId: session.user.id },
        include: { place: true },
        orderBy: { verifiedAt: "desc" },
    });

    // Count visits per place
    const visitCounts = new Map<string, number>();
    for (const v of visits) {
        visitCounts.set(v.placeId, (visitCounts.get(v.placeId) || 0) + 1);
    }

    // Deduplicate: show each place once (most recent visit), with visitCount
    const seen = new Set<string>();
    const formatted = visits
        .filter((v) => {
            if (seen.has(v.placeId)) return false;
            seen.add(v.placeId);
            return true;
        })
        .map((v) => ({
            visitId: v.id,
            placeId: v.place.googlePlaceId,
            name: v.place.name,
            address: v.place.address,
            lat: v.place.lat,
            lng: v.place.lng,
            photoRef: v.place.photoUrl,
            rating: v.place.rating ?? 0,
            price: priceLevelToPrice(v.place.priceLevel),
            method: v.method,
            verifiedAt: v.verifiedAt.toISOString(),
            visitCount: visitCounts.get(v.placeId) || 1,
        }));

    return NextResponse.json(formatted);
}

// POST /api/visits — create a verified visit with GPS check
// Body: { placeId: string, lat: number, lng: number, method: "go_now" | "manual" }
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { placeId, lat, lng, method } = body as {
        placeId: string;
        lat: number;
        lng: number;
        method: "go_now" | "manual";
    };

    if (!placeId || lat == null || lng == null) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Find the place
    const place = await prisma.place.findUnique({
        where: { googlePlaceId: placeId },
    });

    if (!place) {
        return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    // Check proximity
    const distance = haversineMeters(lat, lng, place.lat, place.lng);
    if (distance > MAX_DISTANCE_METERS) {
        return NextResponse.json(
            { error: "Too far away", distance: Math.round(distance), required: MAX_DISTANCE_METERS },
            { status: 400 }
        );
    }

    // Check cooldown: no duplicate visit to the same place within 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentVisit = await prisma.visit.findFirst({
        where: {
            userId: session.user.id,
            placeId: place.id,
            createdAt: { gt: oneHourAgo },
        },
        orderBy: { createdAt: "desc" },
    });

    if (recentVisit) {
        return NextResponse.json(
            { error: "Already checked in within the last hour", nextAllowedAt: new Date(recentVisit.createdAt.getTime() + 60 * 60 * 1000).toISOString() },
            { status: 429 }
        );
    }

    const visit = await prisma.visit.create({
        data: {
            userId: session.user.id,
            placeId: place.id,
            method,
        },
    });

    const visitCount = await prisma.visit.count({
        where: { userId: session.user.id, placeId: place.id },
    });

    // Check badges (non-blocking)
    checkAndAwardBadges(session.user.id).catch(() => {});

    return NextResponse.json({
        visitId: visit.id,
        name: place.name,
        verifiedAt: visit.verifiedAt.toISOString(),
        visitCount,
    });
}
