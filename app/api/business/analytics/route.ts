import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().split("T")[0];
}

function getLast8Weeks(): string[] {
  const weeks: string[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    weeks.push(getWeekStart(d));
  }
  return weeks;
}

interface BusinessAnalyticsResult {
  googlePlaceId: string;
  businessName: string;
  claimStatus: string;
  analytics: {
    totalSaves: number;
    totalVisits: number;
    swipeRightRate: number | null;
    rating: number | null;
    priceLevel: number | null;
    intentBreakdown: Record<string, number>;
    savesOverTime: { week: string; count: number }[];
    vibeTags: { tag: string; count: number }[];
  };
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

    // Get all claims for this user (approved first, then pending)
    const claims = await prisma.businessClaim.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["approved", "pending"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (claims.length === 0) {
      return NextResponse.json({ businesses: [] });
    }

    const eightWeeksAgo = new Date();
    eightWeeksAgo.setUTCDate(eightWeeksAgo.getUTCDate() - 56);
    const weekBuckets = getLast8Weeks();

    const businesses: BusinessAnalyticsResult[] = await Promise.all(
      claims.map(async (claim) => {
        // Find the Place record by googlePlaceId
        const place = await prisma.place.findUnique({
          where: { googlePlaceId: claim.googlePlaceId },
          select: { id: true, rating: true, priceLevel: true },
        });

        // If place doesn't exist in DB yet, return zeroes
        if (!place) {
          return {
            googlePlaceId: claim.googlePlaceId,
            businessName: claim.businessName,
            claimStatus: claim.status,
            analytics: {
              totalSaves: 0,
              totalVisits: 0,
              swipeRightRate: null,
              rating: null,
              priceLevel: null,
              intentBreakdown: {},
              savesOverTime: weekBuckets.map((week) => ({ week, count: 0 })),
              vibeTags: [],
            },
          };
        }

        const placeId = place.id;

        // Run independent queries in parallel
        const [totalSaves, totalVisits, savesByIntent, recentSaves, vibeVotes] =
          await Promise.all([
            // Total saves
            prisma.save.count({ where: { placeId } }),

            // Total visits
            prisma.visit.count({ where: { placeId } }),

            // Intent breakdown via groupBy
            prisma.save.groupBy({
              by: ["intent"],
              where: { placeId },
              _count: { intent: true },
            }),

            // Saves in last 8 weeks for time series
            prisma.save.findMany({
              where: {
                placeId,
                createdAt: { gte: eightWeeksAgo },
              },
              select: { createdAt: true },
            }),

            // Vibe votes for this place
            prisma.vibeVote.findMany({
              where: { placeId },
              select: { vibeTag: true },
            }),
          ]);

        // Build intent breakdown
        const intentBreakdown: Record<string, number> = {};
        for (const row of savesByIntent) {
          intentBreakdown[row.intent] = row._count.intent;
        }

        // Build saves over time (group by week)
        const weekCounts: Record<string, number> = {};
        for (const bucket of weekBuckets) {
          weekCounts[bucket] = 0;
        }
        for (const save of recentSaves) {
          const week = getWeekStart(save.createdAt);
          if (week in weekCounts) {
            weekCounts[week]++;
          }
        }
        const savesOverTime = weekBuckets.map((week) => ({
          week,
          count: weekCounts[week],
        }));

        // Build vibe tags aggregation
        const tagCounts: Record<string, number> = {};
        for (const vote of vibeVotes) {
          tagCounts[vote.vibeTag] = (tagCounts[vote.vibeTag] || 0) + 1;
        }
        const vibeTags = Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count);

        return {
          googlePlaceId: claim.googlePlaceId,
          businessName: claim.businessName,
          claimStatus: claim.status,
          analytics: {
            totalSaves,
            totalVisits,
            swipeRightRate: null,
            rating: place.rating,
            priceLevel: place.priceLevel,
            intentBreakdown,
            savesOverTime,
            vibeTags,
          },
        };
      })
    );

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error("Business analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
