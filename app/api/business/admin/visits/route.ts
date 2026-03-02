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

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setUTCDate(weekStart.getUTCDate() - 7);

    const monthStart = new Date(now);
    monthStart.setUTCMonth(monthStart.getUTCMonth() - 1);

    const [totalVisits, visitsToday, visitsThisWeek, visitsThisMonth, recentVisits] =
      await Promise.all([
        prisma.visit.count(),
        prisma.visit.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.visit.count({ where: { createdAt: { gte: weekStart } } }),
        prisma.visit.count({ where: { createdAt: { gte: monthStart } } }),
        prisma.visit.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, userId: true, placeId: true, method: true, createdAt: true },
        }),
      ]);

    // Resolve user names and place names
    const userIds = [...new Set(recentVisits.map((v) => v.userId))];
    const placeIds = [...new Set(recentVisits.map((v) => v.placeId))];

    const [users, places] = await Promise.all([
      userIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
          })
        : [],
      placeIds.length > 0
        ? prisma.place.findMany({
            where: { id: { in: placeIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, u.name]));
    const placeMap = new Map(places.map((p) => [p.id, p.name]));

    const visits = recentVisits.map((v) => ({
      id: v.id,
      userName: userMap.get(v.userId) || "Unknown",
      placeName: placeMap.get(v.placeId) || "Unknown",
      method: v.method,
      createdAt: v.createdAt,
    }));

    return NextResponse.json({
      totalVisits,
      visitsToday,
      visitsThisWeek,
      visitsThisMonth,
      visits,
    });
  } catch (error) {
    console.error("Admin visits error:", error);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}
