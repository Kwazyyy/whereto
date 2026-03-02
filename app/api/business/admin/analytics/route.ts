import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().split("T")[0];
}

function getLast12Weeks(): string[] {
  const weeks: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    weeks.push(getWeekStart(d));
  }
  return weeks;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setUTCDate(twelveWeeksAgo.getUTCDate() - 84);
    const weekBuckets = getLast12Weeks();

    // Run all independent queries in parallel
    const [
      totalUsers,
      totalBusinessUsers,
      totalSaves,
      totalVisits,
      totalPlaces,
      totalClaims,
      pendingClaims,
      recentUsers,
      recentSaves,
      savesByIntent,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "business" } }),
      prisma.save.count(),
      prisma.visit.count(),
      prisma.place.count(),
      prisma.businessClaim.count(),
      prisma.businessClaim.count({ where: { status: "pending" } }),
      // Users created in last 12 weeks
      prisma.user.findMany({
        where: { createdAt: { gte: twelveWeeksAgo } },
        select: { createdAt: true },
      }),
      // Saves created in last 12 weeks
      prisma.save.findMany({
        where: { createdAt: { gte: twelveWeeksAgo } },
        select: { createdAt: true },
      }),
      // Intent breakdown
      prisma.save.groupBy({
        by: ["intent"],
        _count: { intent: true },
      }),
    ]);

    // Build user growth by week
    const userWeekCounts: Record<string, number> = {};
    for (const bucket of weekBuckets) {
      userWeekCounts[bucket] = 0;
    }
    for (const user of recentUsers) {
      const week = getWeekStart(user.createdAt);
      if (week in userWeekCounts) {
        userWeekCounts[week]++;
      }
    }
    const userGrowth = weekBuckets.map((week) => ({
      week,
      count: userWeekCounts[week],
    }));

    // Build saves growth by week
    const savesWeekCounts: Record<string, number> = {};
    for (const bucket of weekBuckets) {
      savesWeekCounts[bucket] = 0;
    }
    for (const save of recentSaves) {
      const week = getWeekStart(save.createdAt);
      if (week in savesWeekCounts) {
        savesWeekCounts[week]++;
      }
    }
    const savesGrowth = weekBuckets.map((week) => ({
      week,
      count: savesWeekCounts[week],
    }));

    // Top intents
    const topIntents = savesByIntent
      .map((row) => ({ intent: row.intent, count: row._count.intent }))
      .sort((a, b) => b.count - a.count);

    // Top 10 places by save count — fetch save counts grouped by placeId
    const savesByPlace = await prisma.save.groupBy({
      by: ["placeId"],
      _count: { placeId: true },
      orderBy: { _count: { placeId: "desc" } },
      take: 10,
    });

    const topPlaceIds = savesByPlace.map((s) => s.placeId);
    const topPlaceRecords = topPlaceIds.length > 0
      ? await prisma.place.findMany({
          where: { id: { in: topPlaceIds } },
          select: { id: true, name: true, googlePlaceId: true },
        })
      : [];
    const placeMap = new Map(topPlaceRecords.map((p) => [p.id, p]));

    const topPlaces = savesByPlace.map((s) => {
      const place = placeMap.get(s.placeId);
      return {
        name: place?.name || "Unknown",
        googlePlaceId: place?.googlePlaceId || "",
        saveCount: s._count.placeId,
      };
    });

    return NextResponse.json({
      totalUsers,
      totalBusinessUsers,
      totalSaves,
      totalVisits,
      totalPlaces,
      totalClaims,
      pendingClaims,
      userGrowth,
      savesGrowth,
      topPlaces,
      topIntents,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
