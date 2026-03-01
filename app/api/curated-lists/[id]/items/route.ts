import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/curated-lists/[id]/items
// Add a place to the list
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await prisma.curatedList.findUnique({
        where: { id },
        select: { creatorId: true },
    });

    if (!list || list.creatorId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { placeId, note } = await req.json() as { placeId: string; note?: string };

    if (!placeId) {
        return NextResponse.json({ error: "Place ID is required" }, { status: 400 });
    }

    // Get current max position
    const maxPosItem = await prisma.curatedListItem.findFirst({
        where: { listId: id },
        orderBy: { position: "desc" },
        select: { position: true },
    });
    const newPosition = maxPosItem ? maxPosItem.position + 1 : 0;

    try {
        const item = await prisma.curatedListItem.create({
            data: {
                listId: id,
                placeId,
                note,
                position: newPosition,
            },
            include: {
                place: true,
            },
        });

        return NextResponse.json({ item }, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Place is already in this list" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
    }
}
