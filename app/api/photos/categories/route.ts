import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PHOTO_CATEGORIES, MAX_PHOTOS_PER_CATEGORY } from "@/lib/photo-categories";

// GET /api/photos/categories?placeId=X
// Returns the top 3 categories for a user to upload photos for a place
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const placeId = req.nextUrl.searchParams.get("placeId");
        if (!placeId) {
            return NextResponse.json({ error: "placeId is required" }, { status: 400 });
        }

        const userId = session.user.id;

        // Verify user has a verified visit for this place
        const visit = await prisma.visit.findUnique({
            where: { userId_placeId: { userId, placeId } },
        });

        if (!visit) {
            return NextResponse.json({ error: "Must verify your visit first" }, { status: 403 });
        }

        // Check if user already uploaded photos for this place today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayUploads = await prisma.placePhoto.count({
            where: {
                userId,
                placeId,
                createdAt: { gte: todayStart, lte: todayEnd },
            },
        });

        if (todayUploads > 0) {
            return NextResponse.json({ alreadyUploaded: true, categories: [] });
        }

        // Count approved photos per category for this place
        const categoryCounts = await prisma.placePhoto.groupBy({
            by: ["category"],
            where: { placeId, status: "approved" },
            _count: { id: true },
        });

        const countMap = new Map(
            categoryCounts.map((c) => [c.category, c._count.id])
        );

        // Build category list sorted by fewest photos first
        const sorted = [...PHOTO_CATEGORIES]
            .map((cat) => {
                const currentCount = countMap.get(cat.id) ?? 0;
                return {
                    id: cat.id,
                    label: cat.label,
                    prompt: cat.prompt,
                    icon: cat.icon,
                    currentCount,
                    isFull: currentCount >= MAX_PHOTOS_PER_CATEGORY,
                };
            })
            .sort((a, b) => a.currentCount - b.currentCount);

        return NextResponse.json({
            alreadyUploaded: false,
            categories: sorted.slice(0, 3),
        });
    } catch (error) {
        console.error("Photo categories error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch categories";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
