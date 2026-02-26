import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BADGE_DEFINITIONS } from "@/lib/badges";
import { getUserBadgeStats } from "@/lib/checkBadges";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const earnedRecords = await prisma.badge.findMany({
            where: { userId: session.user.id },
            orderBy: { earnedAt: "desc" }
        });

        const earnedMap = new Map(earnedRecords.map(b => [b.badgeType, b.earnedAt]));

        const stats = await getUserBadgeStats(session.user.id);

        return NextResponse.json({
            earned: earnedRecords.map(b => ({
                badgeType: b.badgeType,
                earnedAt: b.earnedAt
            })),
            definitions: BADGE_DEFINITIONS,
            progress: {
                visits: stats.visitedPlacesCount,
                neighborhoods: stats.neighborhoodsExploredCount,
                friends: stats.friendsCount,
                saves: stats.savesCount,
                recommendations: stats.recommendationsSentCount,
                streak: stats.currentStreak,
                uniqueIntents: stats.allIntentsCount
            }
        });
    } catch (e) {
        console.error("GET /api/badges Error:", e);
        return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
    }
}
