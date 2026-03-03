import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/curated-lists/[id]/reorder
// Reorder items in a curated list
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
            return NextResponse.json({ error: "List not found" }, { status: 404 });
        }

        const { itemIds } = (await req.json()) as { itemIds: string[] };
        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return NextResponse.json({ error: "itemIds array is required" }, { status: 400 });
        }

        // Update each item's position to match its index
        for (let i = 0; i < itemIds.length; i++) {
            await prisma.curatedListItem.update({
                where: { id: itemIds[i] },
                data: { position: i },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reorder list error:", error);
        const message = error instanceof Error ? error.message : "Failed to reorder";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
