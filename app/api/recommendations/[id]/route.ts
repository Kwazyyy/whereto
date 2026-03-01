import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    try {
        // Make sure the recommendation belongs to the current user
        const rec = await prisma.recommendation.findUnique({
            where: { id },
        });

        if (!rec) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (rec.receiverId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.recommendation.delete({
            where: { id },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("Error deleting recommendation:", err);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
