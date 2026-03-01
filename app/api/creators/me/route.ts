import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { creatorBio, instagramHandle, tiktokHandle } = body;

        const updated = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                creatorBio,
                instagramHandle: instagramHandle ? (instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`) : null,
                tiktokHandle: tiktokHandle ? (tiktokHandle.startsWith('@') ? tiktokHandle : `@${tiktokHandle}`) : null,
            }
        });

        return NextResponse.json({ success: true, creatorBio: updated.creatorBio });
    } catch (error) {
        console.error("Error updating profile:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
