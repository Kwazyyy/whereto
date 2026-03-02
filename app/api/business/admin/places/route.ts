import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all places
    const rawPlaces = await prisma.place.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        rating: true,
        googlePlaceId: true,
      },
    });

    const placeIds = rawPlaces.map((p) => p.id);

    // Get save and visit counts per place
    const [saveCounts, visitCounts] = await Promise.all([
      prisma.save.groupBy({
        by: ["placeId"],
        where: { placeId: { in: placeIds } },
        _count: { placeId: true },
      }),
      prisma.visit.groupBy({
        by: ["placeId"],
        where: { placeId: { in: placeIds } },
        _count: { placeId: true },
      }),
    ]);

    const saveMap = new Map(saveCounts.map((s) => [s.placeId, s._count.placeId]));
    const visitMap = new Map(visitCounts.map((v) => [v.placeId, v._count.placeId]));

    const places = rawPlaces
      .map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        rating: p.rating,
        googlePlaceId: p.googlePlaceId,
        saveCount: saveMap.get(p.id) || 0,
        visitCount: visitMap.get(p.id) || 0,
      }))
      .sort((a, b) => b.saveCount - a.saveCount);

    return NextResponse.json({ places });
  } catch (error) {
    console.error("Admin places error:", error);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}
