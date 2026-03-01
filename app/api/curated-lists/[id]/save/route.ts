import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/curated-lists/[id]/save
// User saves a curated list
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const listSave = await prisma.curatedListSave.create({
            data: {
                userId,
                listId: id,
            },
        });
        return NextResponse.json({ success: true, save: listSave }, { status: 201 });
    } catch (error: any) {
        // Unique constraint violation
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Already saved" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to save list" }, { status: 500 });
    }
}

// DELETE /api/curated-lists/[id]/save
// User unsaves a curated list
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        await prisma.curatedListSave.delete({
            where: {
                userId_listId: {
                    userId,
                    listId: id,
                },
            },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Not found or already unsaved" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to unsave list" }, { status: 500 });
    }
}
