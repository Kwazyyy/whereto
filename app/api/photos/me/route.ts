import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/photos/me
// Fetches all photos uploaded by the current user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const photos = await prisma.placePhoto.findMany({
            where: { userId },
            include: {
                place: {
                    select: { id: true, name: true, googlePlaceId: true, photoUrl: true },
                },
                _count: {
                    select: { likes: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const formatted = photos.map((p) => ({
            id: p.id,
            cloudinaryUrl: p.cloudinaryUrl,
            caption: p.caption,
            category: p.category,
            status: p.status,
            createdAt: p.createdAt.toISOString(),
            place: {
                id: p.place.id,
                name: p.place.name,
                googlePlaceId: p.place.googlePlaceId,
                photoUrl: p.place.photoUrl,
            },
            likeCount: p._count.likes,
        }));

        const total = photos.length;
        const approved = photos.filter((p) => p.status === "approved").length;
        const pending = photos.filter((p) => p.status === "pending").length;

        return NextResponse.json({
            photos: formatted,
            stats: {
                total,
                approved,
                pending,
                featured: approved,
            },
        });
    } catch (error) {
        console.error("My photos error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch photos";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
