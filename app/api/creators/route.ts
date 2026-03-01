import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const creators = await prisma.user.findMany({
            where: { isCreator: true },
            select: {
                id: true,
                name: true,
                image: true,
                creatorBio: true,
                _count: {
                    select: { followers: true }
                }
            },
            orderBy: {
                followers: { _count: 'desc' }
            }
        });

        const formatted = creators.map(c => ({
            id: c.id,
            name: c.name,
            image: c.image,
            creatorBio: c.creatorBio,
            followerCount: c._count.followers
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching creators:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
