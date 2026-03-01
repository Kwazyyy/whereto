import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/curated-lists/[id]
// Get full list detail with items + places + creator
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

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
                select: { saves: true, items: true },
            },
            saves: session?.user?.id ? {
                where: { userId: session.user.id }
            } : false,
        },
    });

    if (!list) {
        return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // If list is not public, only the creator can view it
    if (!list.isPublic && list.creatorId !== session?.user?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formatted = {
        id: list.id,
        title: list.title,
        description: list.description,
        category: list.category,
        isPublic: list.isPublic,
        createdAt: list.createdAt.toISOString(),
        creator: {
            ...list.creator,
            image: list.creator.customAvatar || list.creator.image,
            isVerified: !!list.creator.verifiedAt,
        },
        stats: {
            places: list._count.items,
            saves: list._count.saves,
        },
        items: list.items.map((i: any) => ({
            id: i.id,
            note: i.note,
            position: i.position,
            place: i.place,
        })),
        hasSaved: list.saves ? list.saves.length > 0 : false,
        heroImage: list.items[0]?.place?.photoUrl || null,
    };

    return NextResponse.json({ list: formatted });
}

// PATCH /api/curated-lists/[id]
// Update list metadata (Creator only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await prisma.curatedList.findUnique({
        where: { id },
        select: { creatorId: true },
    });

    if (!list) {
        return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (list.creatorId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden: Not the creator" }, { status: 403 });
    }

    const { title, description, category, isPublic } = await req.json() as {
        title?: string;
        description?: string;
        category?: string;
        isPublic?: boolean;
    };

    // If making public, check restriction
    if (isPublic) {
        const itemCount = await prisma.curatedListItem.count({
            where: { listId: id }
        });
        if (itemCount < 3) {
            return NextResponse.json({ error: "List must have at least 3 places to be public" }, { status: 400 });
        }
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (category !== undefined) dataToUpdate.category = category;
    if (isPublic !== undefined) dataToUpdate.isPublic = isPublic;

    const updated = await prisma.curatedList.update({
        where: { id },
        data: dataToUpdate,
    });

    return NextResponse.json({ list: updated });
}

// DELETE /api/curated-lists/[id]
// Delete the list entirely (Creator only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await prisma.curatedList.findUnique({
        where: { id },
        select: { creatorId: true },
    });

    if (!list) {
        return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (list.creatorId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.curatedList.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}
