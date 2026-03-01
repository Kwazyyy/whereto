import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id || session.user.id !== id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            include: { _count: { select: { followers: true, saves: true } } }
        });

        if (!user || !user.isCreator) return new NextResponse("Not a creator", { status: 403 });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentFollowers = await prisma.follow.count({
            where: {
                followingId: id,
                createdAt: { gte: thirtyDaysAgo }
            }
        });

        const theirSaves = await prisma.save.findMany({
            where: { userId: id },
            select: { placeId: true, place: { select: { name: true } } }
        });
        const placeIds = theirSaves.map(s => s.placeId);

        let topPlaces: Array<{ placeId: string; name: string; saves: number }> = [];
        if (placeIds.length > 0) {
            const othersSavesOnThosePlaces = await prisma.save.groupBy({
                by: ['placeId'],
                where: {
                    placeId: { in: placeIds },
                    userId: { not: id }
                },
                _count: { placeId: true },
                orderBy: { _count: { placeId: 'desc' } },
                take: 5
            });

            topPlaces = othersSavesOnThosePlaces.map(s => ({
                placeId: s.placeId,
                name: theirSaves.find(ts => ts.placeId === s.placeId)?.place.name || "Unknown",
                saves: s._count.placeId
            }));
        }

        return NextResponse.json({
            totalFollowers: user._count.followers,
            followerGrowth: recentFollowers,
            totalSaves: user._count.saves,
            totalViews: 0,
            topPlaces
        });
    } catch (err) {
        console.error(err);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
