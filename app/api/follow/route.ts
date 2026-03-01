import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return new NextResponse("Missing userId", { status: 400 });
        }

        if (userId === session.user.id) {
            return new NextResponse("Cannot follow yourself", { status: 400 });
        }

        await prisma.follow.upsert({
            where: {
                followerId_followingId: {
                    followerId: session.user.id,
                    followingId: userId
                }
            },
            update: {},
            create: {
                followerId: session.user.id,
                followingId: userId
            }
        });

        const count = await prisma.follow.count({
            where: { followingId: userId }
        });

        return NextResponse.json({ success: true, followerCount: count });
    } catch (error) {
        console.error("Error creating follow:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return new NextResponse("Missing userId", { status: 400 });
        }

        await prisma.follow.deleteMany({
            where: {
                followerId: session.user.id,
                followingId: userId
            }
        });

        const count = await prisma.follow.count({
            where: { followingId: userId }
        });

        return NextResponse.json({ success: true, followerCount: count });
    } catch (error) {
        console.error("Error removing follow:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
