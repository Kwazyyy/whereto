import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/curated-lists/[id]/items/[itemId]
// Remove a place from the list
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    const { id, itemId } = await params;
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

    await prisma.curatedListItem.delete({
        where: { id: itemId },
    });

    // Re-order remaining list items (optional but good practice)
    const remaining = await prisma.curatedListItem.findMany({
        where: { listId: id },
        orderBy: { position: "asc" },
    });

    for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].position !== i) {
            await prisma.curatedListItem.update({
                where: { id: remaining[i].id },
                data: { position: i },
            });
        }
    }

    return NextResponse.json({ success: true });
}
