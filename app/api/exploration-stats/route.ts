import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { torontoNeighborhoods, getNeighborhoodForPlace } from "@/lib/neighborhoods";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user visits with place coordinates
    const visits = await prisma.visit.findMany({
        where: { userId: session.user.id },
        include: { place: true },
        orderBy: { verifiedAt: "asc" }, // Ascending so we can track the "first" visit to a neighborhood
    });

    // Track stats per neighborhood
    const statsMap = new Map<string, { explored: boolean; visitCount: number; uniquePlaces: Set<string>; firstVisitDate: Date | null }>();

    // Initialize all neighborhoods as undiscovered
    for (const hood of torontoNeighborhoods) {
        statsMap.set(hood.name, {
            explored: false,
            visitCount: 0,
            uniquePlaces: new Set(),
            firstVisitDate: null,
        });
    }

    // Aggregate visits
    for (const v of visits) {
        if (v.place.lat == null || v.place.lng == null) continue;
        const hood = getNeighborhoodForPlace(v.place.lat, v.place.lng);
        if (hood) {
            const stats = statsMap.get(hood.name)!;
            stats.explored = true;
            stats.visitCount += 1;
            stats.uniquePlaces.add(v.placeId);
            if (!stats.firstVisitDate || v.verifiedAt < stats.firstVisitDate) {
                stats.firstVisitDate = v.verifiedAt;
            }
        }
    }

    // Format response
    const neighborhoodsResult = Array.from(statsMap.entries()).map(([name, data]) => {
        const hoodDef = torontoNeighborhoods.find(h => h.name === name);
        return {
            name,
            area: hoodDef?.area || "Unknown",
            explored: data.explored,
            visitCount: data.visitCount,
            uniquePlaceCount: data.uniquePlaces.size,
            firstVisitDate: data.firstVisitDate ? data.firstVisitDate.toISOString() : null,
        };
    });

    const exploredCount = neighborhoodsResult.filter(n => n.explored).length;
    const percentage = Math.round((exploredCount / torontoNeighborhoods.length) * 100);

    return NextResponse.json({
        totalNeighborhoods: torontoNeighborhoods.length,
        exploredCount,
        percentage,
        neighborhoods: neighborhoodsResult,
    });
}
