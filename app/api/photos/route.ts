import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadPhoto } from "@/lib/cloudinary";
import { PHOTO_CATEGORIES } from "@/lib/photo-categories";

const VALID_CATEGORY_IDS: Set<string> = new Set(PHOTO_CATEGORIES.map((c) => c.id));
const CATEGORY_IDS = PHOTO_CATEGORIES.map((c) => c.id);
const MAX_CAPTION_LENGTH = 200;

// GET /api/photos?placeId=X
// Fetches all approved photos for a place, grouped by category
export async function GET(req: NextRequest) {
    try {
        const placeId = req.nextUrl.searchParams.get("placeId");
        if (!placeId) {
            return NextResponse.json({ error: "placeId is required" }, { status: 400 });
        }

        // Optional auth — used for likedByMe
        const session = await auth();
        const userId = session?.user?.id ?? null;

        // Fetch approved photos with user info and like count
        const photos = await prisma.placePhoto.findMany({
            where: { placeId, status: "approved" },
            include: {
                user: {
                    select: { id: true, name: true, avatarUrl: true },
                },
                _count: {
                    select: { likes: true },
                },
            },
            orderBy: [
                { likes: { _count: "desc" } },
                { createdAt: "desc" },
            ],
        });

        // If logged in, batch-check which photos the user has liked
        let likedPhotoIds = new Set<string>();
        if (userId && photos.length > 0) {
            const userLikes = await prisma.photoLike.findMany({
                where: {
                    userId,
                    photoId: { in: photos.map((p) => p.id) },
                },
                select: { photoId: true },
            });
            likedPhotoIds = new Set(userLikes.map((l) => l.photoId));
        }

        // Group by category
        const grouped: Record<string, Array<{
            id: string;
            cloudinaryUrl: string;
            caption: string | null;
            category: string;
            createdAt: string;
            user: { id: string; name: string | null; avatarUrl: string | null };
            likeCount: number;
            likedByMe: boolean;
        }>> = {};

        for (const catId of CATEGORY_IDS) {
            grouped[catId] = [];
        }

        for (const photo of photos) {
            const cat = photo.category;
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push({
                id: photo.id,
                cloudinaryUrl: photo.cloudinaryUrl,
                caption: photo.caption,
                category: photo.category,
                createdAt: photo.createdAt.toISOString(),
                user: {
                    id: photo.user.id,
                    name: photo.user.name,
                    avatarUrl: photo.user.avatarUrl,
                },
                likeCount: photo._count.likes,
                likedByMe: likedPhotoIds.has(photo.id),
            });
        }

        // Top contributor for this place
        const topContributors = await prisma.placePhoto.groupBy({
            by: ["userId"],
            where: { placeId, status: "approved" },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 1,
        });

        let topContributor: { id: string; name: string | null; avatarUrl: string | null; photoCount: number } | null = null;

        if (topContributors.length > 0) {
            const topUser = await prisma.user.findUnique({
                where: { id: topContributors[0].userId },
                select: { id: true, name: true, avatarUrl: true },
            });
            if (topUser) {
                topContributor = {
                    ...topUser,
                    photoCount: topContributors[0]._count.id,
                };
            }
        }

        return NextResponse.json({
            photos: grouped,
            totalCount: photos.length,
            topContributor,
        });
    } catch (error) {
        console.error("Fetch photos error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch photos";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST /api/photos
// Upload a community photo for a place
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const { placeId, category, imageBase64, caption } = body as {
            placeId?: string;
            category?: string;
            imageBase64?: string;
            caption?: string;
        };

        // Validate required fields
        if (!placeId) {
            return NextResponse.json({ error: "placeId is required" }, { status: 400 });
        }
        if (!category || !VALID_CATEGORY_IDS.has(category)) {
            return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }
        if (!imageBase64 || !imageBase64.startsWith("data:image/")) {
            return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
        }
        if (caption && caption.length > MAX_CAPTION_LENGTH) {
            return NextResponse.json({ error: `Caption must be ${MAX_CAPTION_LENGTH} characters or less` }, { status: 400 });
        }

        // Verify user has a verified visit for this place
        const visit = await prisma.visit.findFirst({
            where: { userId, placeId },
        });

        if (!visit) {
            return NextResponse.json({ error: "Must verify your visit first" }, { status: 403 });
        }

        // Check if user already uploaded in this category for this place today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existingToday = await prisma.placePhoto.findFirst({
            where: {
                userId,
                placeId,
                category,
                createdAt: { gte: todayStart, lte: todayEnd },
            },
        });

        if (existingToday) {
            return NextResponse.json({ error: "Already uploaded for this category today" }, { status: 400 });
        }

        // Upload to Cloudinary
        const { url, publicId, thumbnailUrl } = await uploadPhoto(imageBase64);

        // Create database record
        const photo = await prisma.placePhoto.create({
            data: {
                userId,
                placeId,
                cloudinaryUrl: url,
                publicId,
                category,
                caption: caption || null,
                status: "pending",
            },
        });

        return NextResponse.json({
            photo: {
                id: photo.id,
                cloudinaryUrl: photo.cloudinaryUrl,
                thumbnailUrl,
                category: photo.category,
                caption: photo.caption,
                status: photo.status,
                createdAt: photo.createdAt.toISOString(),
            },
        }, { status: 201 });
    } catch (error) {
        console.error("Photo upload error:", error);
        const message = error instanceof Error ? error.message : "Failed to upload photo";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
