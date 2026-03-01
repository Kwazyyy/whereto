import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/curated-lists
// Create a new curated list (Creator only)
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isCreator: true },
    });

    if (!user?.isCreator) {
        return NextResponse.json({ error: "Forbidden: Creators only" }, { status: 403 });
    }

    const { title, description, category } = await req.json() as {
        title: string;
        description?: string;
        category: string;
    };

    if (!title || !category) {
        return NextResponse.json({ error: "Title and Category are required" }, { status: 400 });
    }

    const list = await prisma.curatedList.create({
        data: {
            creatorId: userId,
            title,
            description,
            category,
            isPublic: false, // Starts as draft
        },
    });

    return NextResponse.json({ list }, { status: 201 });
}

// GET /api/curated-lists
// Browse public lists
// Query: ?category=X&sort=popular|recent (default: recent)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "recent";

    const where: any = {
        isPublic: true,
    };

    if (category && category !== "All") {
        where.category = category;
    }

    const orderBy: any = sort === "popular"
        ? { saves: { _count: "desc" } }
        : { createdAt: "desc" };

    const lists = await prisma.curatedList.findMany({
        where,
        orderBy,
        include: {
            creator: {
                select: {
                    id: true,
                    name: true,
                    customAvatar: true,
                    image: true,
                    verifiedAt: true,
                },
            },
            _count: {
                select: {
                    items: true,
                    saves: true,
                },
            },
            // We need the first place's photo for the background
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

    // Map to a cleaner format
    const formattedLists = lists.map((list: any) => ({
        id: list.id,
        title: list.title,
        category: list.category,
        createdAt: list.createdAt.toISOString(),
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
