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

    const rawUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Get save and visit counts per user separately to avoid Neon HTTP transaction issues
    const userIds = rawUsers.map((u) => u.id);

    const [saveCounts, visitCounts] = await Promise.all([
      prisma.save.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: { userId: true },
      }),
      prisma.visit.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: { userId: true },
      }),
    ]);

    const saveMap = new Map(saveCounts.map((s) => [s.userId, s._count.userId]));
    const visitMap = new Map(visitCounts.map((v) => [v.userId, v._count.userId]));

    const users = rawUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      saveCount: saveMap.get(u.id) || 0,
      visitCount: visitMap.get(u.id) || 0,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
