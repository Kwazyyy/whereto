import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = [
    "date_night", "study_spots", "budget_eats", "hidden_gems",
    "brunch", "patios", "coffee", "late_night", "groups",
];

export async function PATCH(
    req: NextRequest,
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

        const itemCount = await prisma.curatedListItem.count({ where: { listId: id } });
        if (itemCount < 3) {
            return NextResponse.json(
                { error: "Lists need at least 3 places to publish" },
                { status: 400 }
            );
        }

        const { category } = (await req.json()) as { category: string };
        if (!category || !VALID_CATEGORIES.includes(category)) {
            return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        const updated = await prisma.curatedList.update({
            where: { id },
            data: {
                status: "published",
                category,
                publishedAt: new Date(),
                isPublic: true,
            },
        });

        return NextResponse.json({ success: true, list: updated });
    } catch (error) {
        console.error("Publish list error:", error);
        const message = error instanceof Error ? error.message : "Failed to publish list";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
