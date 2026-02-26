import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getNeighborhoodForPlace } from "@/lib/neighborhoods";

// GET /api/exploration-stats/check-new-neighborhood?placeId=YOUR_PLACE_ID
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get("placeId");

    if (!placeId) {
        return NextResponse.json({ error: "Missing placeId parameter" }, { status: 400 });
    }

    try {
        // 1. Fetch the exact place the user is checking in to
        const place = await prisma.place.findUnique({
            where: { googlePlaceId: placeId }
        });

        if (!place) {
            return NextResponse.json({ error: "Place not found in database" }, { status: 404 });
        }

        // 2. Identify the neighborhood the place belongs to
        const neighborhood = getNeighborhoodForPlace(place.lat, place.lng);
        if (!neighborhood) {
            // Not in a tracked neighborhood, so it can't unlock one
            return NextResponse.json({
                isNewNeighborhood: false,
                neighborhood: null,
                totalExplored: 0,
                totalNeighborhoods: 42 // toronto pattern count roughly
            });
        }

        // 3. Fetch all visits for the user and map them to neighborhoods to count progression
        const userVisits = await prisma.visit.findMany({
            where: { userId: session.user.id },
            include: { place: true }
        });

        const exploredNeighborhoods = new Set<string>();
        let visitsInThisHood = 0;

        for (const visit of userVisits) {
            const hood = getNeighborhoodForPlace(visit.place.lat, visit.place.lng);
            if (hood) {
                exploredNeighborhoods.add(hood.name);
                if (hood.name === neighborhood.name) {
                    visitsInThisHood++;
                }
            }
        }

        // If 'visitsInThisHood' equals exactly 1, it means the visit they literally *just* 
        // recorded was the FIRST time they've ever been here. 
        // If it's > 1, they've been here before.
        // If it's 0 somehow (race condition or they haven't verified the visit yet), we return false.
        const isNewNeighborhood = visitsInThisHood === 1;

        return NextResponse.json({
            isNewNeighborhood,
            neighborhood: neighborhood ? { name: neighborhood.name, area: neighborhood.area } : null,
            totalExplored: exploredNeighborhoods.size,
            totalNeighborhoods: 42 // Static for now based on torontoNeighborhoods array
        });

    } catch (e) {
        console.error("Neighborhood check error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
