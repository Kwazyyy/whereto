import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/recommendations/unseen-count
// Returns the number of unseen recommendations for the current user.
// Called by BottomNav to show the badge.
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ count: 0 });
    }

    const count = await prisma.recommendation.count({
        where: { receiverId: session.user.id, seen: false },
    });

    return NextResponse.json({ count });
}
