import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVibeByLabel } from "@/lib/vibeTags";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { placeId, vibeTags } = body;

        if (!placeId || !Array.isArray(vibeTags)) {
            return new NextResponse("Invalid request", { status: 400 });
        }

        if (vibeTags.length > 8) {
            return new NextResponse("Too many vibe tags", { status: 400 });
        }

        // Verify the user has visited this place
        const visit = await prisma.visit.findFirst({
            where: {
                userId: session.user.id,
                placeId: placeId,
            }
        });

        if (!visit) {
            return new NextResponse("Must visit place before voting on vibes", { status: 403 });
        }

        // Delete existing votes for this place/user first to recreate
        await prisma.vibeVote.deleteMany({
            where: {
                userId: session.user.id,
                placeId: placeId,
            }
        });

        const userId = session.user.id;
        // Create new votes
        if (vibeTags.length > 0) {
            await prisma.vibeVote.createMany({
                data: vibeTags.map(tag => ({
                    userId: userId,
                    placeId: placeId,
                    vibeTag: tag,
                }))
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving vibe votes:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const placeId = searchParams.get("placeId");
        const session = await auth();
        const currentUserId = session?.user?.id;

        if (!placeId) {
            if (!currentUserId) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            // Return all votes for the current user
            const userVotes = await prisma.vibeVote.findMany({
                where: { userId: currentUserId },
                select: { placeId: true, vibeTag: true }
            });

            const votesByPlace = userVotes.reduce((acc: Record<string, string[]>, vote: { placeId: string; vibeTag: string }) => {
                if (!acc[vote.placeId]) acc[vote.placeId] = [];
                acc[vote.placeId].push(vote.vibeTag);
                return acc;
            }, {} as Record<string, string[]>);

            return NextResponse.json({ userVotes: votesByPlace });
        }

        // Fetch all votes for this place
        const allVotes = await prisma.vibeVote.findMany({
            where: { placeId }
        });

        // Group by user id to count total unique voters
        const uniqueVoters = new Set(allVotes.map((v: { userId: string }) => v.userId));
        const totalVoters = uniqueVoters.size;

        // Tally up the vibes
        const counts: Record<string, number> = {};
        for (const vote of allVotes) {
            counts[vote.vibeTag] = (counts[vote.vibeTag] || 0) + 1;
        }

        // Filter for current user's votes
        const userVotes = currentUserId
            ? allVotes.filter((v: { userId: string; vibeTag: string }) => v.userId === currentUserId).map((v: { vibeTag: string }) => v.vibeTag)
            : [];

        // Formatting the output
        const vibes = Object.entries(counts)
            .map(([tag, count]) => {
                const tagDef = getVibeByLabel(tag);
                return {
                    tag,
                    emoji: tagDef?.emoji || "✨", // Fallback emoji
                    count,
                    percentage: totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0
                };
            })
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({
            vibes,
            totalVoters,
            userVotes
        });
    } catch (error) {
        console.error("Error fetching vibe votes:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
