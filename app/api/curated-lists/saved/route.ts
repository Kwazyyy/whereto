import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/curated-lists/saved
// Returns the current user's saved lists
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const savedLists = await prisma.curatedListSave.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            list: {
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
                    _count: {
                        select: { items: true, saves: true },
                    },
                    items: {
                        take: 1,
                        orderBy: { position: "asc" },
                        include: {
                            place: {
                                select: { photoUrl: true },
                            },
                        },
                    },
                },
            },
        },
    });

    const formattedLists = savedLists.map(({ list }: any) => ({
        id: list.id,
        title: list.title,
        category: list.category,
        creator: {
            id: list.creator.id,
            name: list.creator.name,
            image: list.creator.customAvatar || list.creator.image,
            isVerified: !!list.creator.verifiedAt,
        },
        stats: {
            places: list._count.items,
            saves: list._count.saves,
        },
        heroImage: list.items[0]?.place?.photoUrl || null,
    }));

    return NextResponse.json({ lists: formattedLists });
}
