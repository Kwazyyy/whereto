import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { id } = await params;

        const list = await prisma.curatedList.findUnique({
            where: { id },
            select: { creatorId: true },
        });

        if (!list || list.creatorId !== session.user.id) {
            return NextResponse.json({ error: "List not found" }, { status: 404 });
        }

        await prisma.curatedList.update({
            where: { id },
            data: {
                status: "draft",
                publishedAt: null,
                isPublic: false,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Unpublish list error:", error);
        const message = error instanceof Error ? error.message : "Failed to unpublish list";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
