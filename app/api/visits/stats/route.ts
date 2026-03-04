import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/visits/stats — returns visit statistics for the current user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all visits with place data
    const visits = await prisma.visit.findMany({
        where: { userId },
        include: { place: true },
        orderBy: { createdAt: "desc" },
    });

    if (visits.length === 0) {
        return NextResponse.json({
            mostVisited: [],
            totalVisits: 0,
            totalPlaces: 0,
            streaks: [],
            regularPlaces: [],
        });
    }

    // Group visits by placeId
    const visitsByPlace = new Map<string, typeof visits>();
    for (const v of visits) {
        const arr = visitsByPlace.get(v.placeId) || [];
        arr.push(v);
        visitsByPlace.set(v.placeId, arr);
    }

    const totalVisits = visits.length;
    const totalPlaces = visitsByPlace.size;

    // Most visited — top 5 by count
    const placeStats = Array.from(visitsByPlace.entries()).map(([placeId, placeVisits]) => ({
        placeId,
        place: placeVisits[0].place,
        visitCount: placeVisits.length,
        lastVisited: placeVisits[0].createdAt, // already sorted desc
    }));

    placeStats.sort((a, b) => b.visitCount - a.visitCount);

    const mostVisited = placeStats.slice(0, 5).map(ps => ({
        place: {
            id: ps.place.id,
            name: ps.place.name,
            googlePlaceId: ps.place.googlePlaceId,
            photoUrl: ps.place.photoUrl,
        },
        visitCount: ps.visitCount,
        lastVisited: ps.lastVisited.toISOString(),
    }));

    // Weekly streaks per place (for places visited more than once)
    const getWeekKey = (date: Date): string => {
        // ISO week: Monday-based. Use the Monday of the week as key.
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
        const monday = new Date(d.setDate(diff));
        return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    };

    const streaks: {
        place: { id: string; name: string; photoUrl: string | null };
        currentStreak: number;
        longestStreak: number;
        lastVisited: string;
    }[] = [];

    for (const [, placeVisits] of visitsByPlace) {
        if (placeVisits.length < 2) continue;

        // Get unique weeks visited (sorted newest first)
        const weeks = [...new Set(placeVisits.map(v => getWeekKey(v.createdAt)))].sort((a, b) => b.localeCompare(a));

        if (weeks.length < 2) continue;

        // Calculate current streak (consecutive weeks from most recent)
        let currentStreak = 1;
        for (let i = 0; i < weeks.length - 1; i++) {
            const currentMonday = new Date(weeks[i]);
            const nextMonday = new Date(weeks[i + 1]);
            const diffMs = currentMonday.getTime() - nextMonday.getTime();
            const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
            if (diffWeeks === 1) {
                currentStreak++;
            } else {
                break;
            }
        }

        // Check if current streak is still active (most recent week is this week or last week)
        const now = new Date();
        const thisWeek = getWeekKey(now);
        const lastWeek = getWeekKey(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        if (weeks[0] !== thisWeek && weeks[0] !== lastWeek) {
            currentStreak = 0; // streak is broken
        }

        // Calculate longest streak
        let longestStreak = 1;
        let tempStreak = 1;
        for (let i = 0; i < weeks.length - 1; i++) {
            const currentMonday = new Date(weeks[i]);
            const nextMonday = new Date(weeks[i + 1]);
            const diffMs = currentMonday.getTime() - nextMonday.getTime();
            const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
            if (diffWeeks === 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
        }

        if (currentStreak >= 2) {
            streaks.push({
                place: {
                    id: placeVisits[0].place.id,
                    name: placeVisits[0].place.name,
                    photoUrl: placeVisits[0].place.photoUrl,
                },
                currentStreak,
                longestStreak,
                lastVisited: placeVisits[0].createdAt.toISOString(),
            });
        }
    }

    streaks.sort((a, b) => b.currentStreak - a.currentStreak);

    // Regular places — visited 3+ times
    const regularPlaces = placeStats
        .filter(ps => ps.visitCount >= 3)
        .map(ps => ({
            place: {
                id: ps.place.id,
                name: ps.place.name,
                googlePlaceId: ps.place.googlePlaceId,
                photoUrl: ps.place.photoUrl,
            },
            visitCount: ps.visitCount,
            lastVisited: ps.lastVisited.toISOString(),
        }));

    return NextResponse.json({
        mostVisited,
        totalVisits,
        totalPlaces,
        streaks,
        regularPlaces,
    });
}
