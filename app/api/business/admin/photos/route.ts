import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MAX_PHOTOS_PER_CATEGORY, PHOTO_AGE_LIMIT_DAYS } from "@/lib/photo-categories";
import { checkAndAwardBadges } from "@/lib/checkBadges";

// GET /api/business/admin/photos
// Fetches photos for admin moderation review
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (user?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const status = req.nextUrl.searchParams.get("status") || "pending";
        const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20", 10)));
        const skip = (page - 1) * limit;

        const [photos, total] = await Promise.all([
            prisma.placePhoto.findMany({
                where: { status },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatarUrl: true },
                    },
                    place: {
                        select: { id: true, name: true, googlePlaceId: true, address: true },
                    },
                    _count: {
                        select: { likes: true },
                    },
                },
                orderBy: { createdAt: "asc" },
                skip,
                take: limit,
            }),
            prisma.placePhoto.count({ where: { status } }),
        ]);

        const formatted = photos.map((p) => ({
            id: p.id,
            cloudinaryUrl: p.cloudinaryUrl,
            publicId: p.publicId,
            category: p.category,
            caption: p.caption,
            status: p.status,
            createdAt: p.createdAt.toISOString(),
            user: p.user,
            place: p.place,
            likeCount: p._count.likes,
        }));

        return NextResponse.json({
            photos: formatted,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Admin photos fetch error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch photos";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PATCH /api/business/admin/photos
// Approve or reject a photo, with rotation when approving a full category
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const adminUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (adminUser?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { photoId, action } = body as { photoId?: string; action?: string };

        if (!photoId || !action || !["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "photoId and action (approve|reject) are required" }, { status: 400 });
        }

        // Verify photo exists and is pending
        const photo = await prisma.placePhoto.findUnique({
            where: { id: photoId },
        });

        if (!photo) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 });
        }

        // Allow transitions: pending/rejected → approve, pending/approved → reject
        if (action === "approve" && photo.status !== "pending" && photo.status !== "rejected") {
            return NextResponse.json({ error: "Photo cannot be approved from this state" }, { status: 400 });
        }
        if (action === "reject" && photo.status !== "pending" && photo.status !== "approved") {
            return NextResponse.json({ error: "Photo cannot be rejected from this state" }, { status: 400 });
        }

        // --- REJECT ---
        if (action === "reject") {
            const rejected = await prisma.placePhoto.update({
                where: { id: photoId },
                data: { status: "rejected" },
            });

            return NextResponse.json({
                approved: null,
                rejected: {
                    id: rejected.id,
                    status: rejected.status,
                },
                archived: null,
            });
        }

        // --- APPROVE (with rotation logic) ---

        // Count currently approved photos in this place + category
        const approvedCount = await prisma.placePhoto.count({
            where: {
                placeId: photo.placeId,
                category: photo.category,
                status: "approved",
            },
        });

        let archivedPhoto = null;

        // If the category is full, we need to archive one photo to make room
        if (approvedCount >= MAX_PHOTOS_PER_CATEGORY) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - PHOTO_AGE_LIMIT_DAYS);

            // Step 1: Look for photos older than 90 days — oldest first
            const oldPhoto = await prisma.placePhoto.findFirst({
                where: {
                    placeId: photo.placeId,
                    category: photo.category,
                    status: "approved",
                    createdAt: { lt: cutoffDate },
                },
                orderBy: { createdAt: "asc" },
            });

            if (oldPhoto) {
                // Archive the oldest expired photo
                archivedPhoto = await prisma.placePhoto.update({
                    where: { id: oldPhoto.id },
                    data: { status: "archived" },
                });
            } else {
                // Step 2: No expired photos — archive the one with fewest likes.
                // On tie, pick the oldest.
                const leastLiked = await prisma.placePhoto.findFirst({
                    where: {
                        placeId: photo.placeId,
                        category: photo.category,
                        status: "approved",
                    },
                    include: {
                        _count: { select: { likes: true } },
                    },
                    orderBy: [
                        { likes: { _count: "asc" } },
                        { createdAt: "asc" },
                    ],
                });

                if (leastLiked) {
                    archivedPhoto = await prisma.placePhoto.update({
                        where: { id: leastLiked.id },
                        data: { status: "archived" },
                    });
                }
            }
        }

        // Approve the new photo
        const approved = await prisma.placePhoto.update({
            where: { id: photoId },
            data: { status: "approved" },
        });

        // Check photo badges for the uploader (non-blocking)
        checkAndAwardBadges(photo.userId).catch(() => {});

        return NextResponse.json({
            approved: {
                id: approved.id,
                cloudinaryUrl: approved.cloudinaryUrl,
                category: approved.category,
                status: approved.status,
            },
            archived: archivedPhoto
                ? {
                    id: archivedPhoto.id,
                    cloudinaryUrl: archivedPhoto.cloudinaryUrl,
                    status: archivedPhoto.status,
                }
                : null,
        });
    } catch (error) {
        console.error("Admin photo moderation error:", error);
        const message = error instanceof Error ? error.message : "Failed to moderate photo";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
