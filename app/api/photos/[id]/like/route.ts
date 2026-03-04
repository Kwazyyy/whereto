import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAndAwardBadges } from "@/lib/checkBadges";

// POST /api/photos/[id]/like
// Toggles a like on an approved photo
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: photoId } = await params;
        const userId = session.user.id;

        // Verify photo exists and is approved
        const photo = await prisma.placePhoto.findUnique({
            where: { id: photoId },
            select: { id: true, status: true, userId: true },
        });

        if (!photo || photo.status !== "approved") {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        // Check if already liked
        const existingLike = await prisma.photoLike.findUnique({
            where: { userId_photoId: { userId, photoId } },
        });

        if (existingLike) {
            // Unlike
            await prisma.photoLike.delete({
                where: { id: existingLike.id },
            });
        } else {
            // Like
            await prisma.photoLike.create({
                data: { userId, photoId },
            });
        }

        const likeCount = await prisma.photoLike.count({
            where: { photoId },
        });

        // Check crowd_favorite badge for the photo owner (non-blocking, only on like)
        if (!existingLike) {
            checkAndAwardBadges(photo.userId).catch(() => {});
        }

        return NextResponse.json({
            liked: !existingLike,
            likeCount,
        });
    } catch (error) {
        console.error("Photo like toggle error:", error);
        const message = error instanceof Error ? error.message : "Failed to toggle like";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
