import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateCompatibility, SaveRow } from "@/lib/tasteScore";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: friendId } = await params;
    const userId = session.user.id;

    // Verify accepted friendship
    const friendship = await prisma.friendship.findFirst({
        where: {
            status: "accepted",
            OR: [
                { senderId: userId, receiverId: friendId },
                { senderId: friendId, receiverId: userId },
            ],
        },
    });

    if (!friendship) {
        return NextResponse.json({ error: "Not friends" }, { status: 403 });
    }

    // Fetch both users' saves with place data
    const [mySavesRaw, friendSavesRaw] = await Promise.all([
        prisma.save.findMany({
            where: { userId },
            include: {
                place: {
                    select: {
                        id: true,
                        googlePlaceId: true,
                        name: true,
                        photoUrl: true,
                        priceLevel: true,
                        rating: true,
                    },
                },
            },
        }),
        prisma.save.findMany({
            where: { userId: friendId },
            include: {
                place: {
                    select: {
                        id: true,
                        googlePlaceId: true,
                        name: true,
                        photoUrl: true,
                        priceLevel: true,
                        rating: true,
                    },
                },
            },
        }),
    ]);

    function toSaveRow(s: typeof mySavesRaw[number]): SaveRow {
        return {
            placeId: s.place.id,
            googlePlaceId: s.place.googlePlaceId,
            name: s.place.name,
            photoRef: s.place.photoUrl,
            intent: s.intent,
            priceLevel: s.place.priceLevel,
            rating: s.place.rating,
        };
    }

    const result = calculateCompatibility(
        mySavesRaw.map(toSaveRow),
        friendSavesRaw.map(toSaveRow),
    );

    return NextResponse.json(result);
}
