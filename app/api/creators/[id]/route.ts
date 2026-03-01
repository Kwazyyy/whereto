import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVibeByLabel } from "@/lib/vibeTags";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!id) return new NextResponse("Missing id", { status: 400 });

        const session = await auth();
        const currentUserId = session?.user?.id;

        const creator = await prisma.user.findUnique({
            where: { id: id, isCreator: true },
            include: {
                _count: {
                    select: { followers: true, following: true, saves: true, visits: true }
                }
            }
        });

        if (!creator) return new NextResponse("Creator not found", { status: 404 });

        let isFollowing = false;
        if (currentUserId) {
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: id
                    }
                }
            });
            isFollowing = !!follow;
        }

        const recentSaves = await prisma.save.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { place: true }
        });

        const allSaves = await prisma.save.findMany({
            where: { userId: id },
            include: { place: true },
            orderBy: { createdAt: 'desc' }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boards: Record<string, any[]> = {};
        allSaves.forEach(save => {
            const intent = save.intent || "uncategorized";
            if (!boards[intent]) boards[intent] = [];
            boards[intent].push(save);
        });

        const formattedBoards = Object.entries(boards).map(([intent, items]) => ({
            intent,
            items
        })).sort((a, b) => b.items.length - a.items.length);

        const vibeVotes = await prisma.vibeVote.findMany({
            where: { userId: id }
        });
        const vibeCounts: Record<string, number> = {};
        vibeVotes.forEach(v => {
            vibeCounts[v.vibeTag] = (vibeCounts[v.vibeTag] || 0) + 1;
        });
        const topVibes = Object.entries(vibeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => {
                const def = getVibeByLabel(tag);
                return def ? { tag, emoji: def.emoji } : { tag, emoji: "✨" };
            });

        return NextResponse.json({
            creator: {
                id: creator.id,
                name: creator.name,
                image: creator.image,
                creatorBio: creator.creatorBio,
                instagramHandle: creator.instagramHandle,
                tiktokHandle: creator.tiktokHandle,
                verifiedAt: creator.verifiedAt,
                followers: creator._count.followers,
                following: creator._count.following,
                savedCount: creator._count.saves,
                visitedCount: creator._count.visits,
                isFollowing
            },
            recentSaves,
            boards: formattedBoards,
            topVibes
        });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
