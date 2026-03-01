import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/curated-lists/mine
// Returns the creator's own lists (both public and draft)
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const lists = await prisma.curatedList.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: {
                    items: true,
                    saves: true,
                },
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
    });

    const formattedLists = lists.map((list: any) => ({
        id: list.id,
        title: list.title,
        description: list.description,
        category: list.category,
        isPublic: list.isPublic,
        createdAt: list.createdAt.toISOString(),
        stats: {
            places: list._count.items,
            saves: list._count.saves,
        },
        heroImage: list.items[0]?.place?.photoUrl || null,
    }));

    return NextResponse.json({ lists: formattedLists });
}
