import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/lists/[id]/public
// Public endpoint — no authentication required
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const list = await prisma.curatedList.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        customAvatar: true,
                        verifiedAt: true,
                    },
                },
                items: {
                    orderBy: { position: "asc" },
                    include: {
                        place: true,
                    },
                },
                _count: {
                    select: { items: true },
                },
            },
        });

        if (!list || !list.isPublic) {
            return NextResponse.json({ error: "List not found" }, { status: 404 });
        }

        // Increment view count (fire-and-forget)
        prisma.curatedList.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        }).catch(() => {});

        const formatted = {
            id: list.id,
            title: list.title,
            description: list.description,
            category: list.category,
            createdAt: list.createdAt.toISOString(),
            creator: {
                id: list.creator.id,
                name: list.creator.name,
                image: list.creator.customAvatar || list.creator.image,
                isVerified: !!list.creator.verifiedAt,
            },
            items: list.items.map((i) => ({
                id: i.id,
                note: i.note,
                position: i.position,
                place: {
                    id: i.place.id,
                    googlePlaceId: i.place.googlePlaceId,
                    name: i.place.name,
                    address: i.place.address,
                    rating: i.place.rating,
                    priceLevel: i.place.priceLevel,
                    photoUrl: i.place.photoUrl,
                },
            })),
            stats: {
                places: list._count.items,
                views: list.viewCount + 1,
            },
        };

        return NextResponse.json({ list: formatted });
    } catch (error) {
        console.error("Public list fetch error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch list";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
