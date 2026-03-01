import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { displayName, username, bio, customAvatar } = body;

        let updatedUsername = undefined;

        if (username !== undefined) {
            if (username === "") {
                updatedUsername = null;
            } else {
                const lowerUsername = username.toLowerCase().trim();
                if (!USERNAME_REGEX.test(lowerUsername)) {
                    return NextResponse.json(
                        { error: "Username must be 3-20 characters, lowercase alphanumeric and underscores only." },
                        { status: 400 }
                    );
                }

                const existing = await prisma.user.findFirst({
                    where: {
                        username: lowerUsername,
                        id: { not: session.user.id }
                    },
                });

                if (existing) {
                    return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
                }
                updatedUsername = lowerUsername;
            }
        }

        const dataToUpdate: any = {};
        if (displayName !== undefined) dataToUpdate.displayName = displayName;
        if (updatedUsername !== undefined) dataToUpdate.username = updatedUsername;
        if (bio !== undefined) dataToUpdate.creatorBio = bio;
        if (customAvatar !== undefined) dataToUpdate.customAvatar = customAvatar;

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: dataToUpdate,
            select: {
                id: true,
                displayName: true,
                username: true,
                creatorBio: true,
                customAvatar: true,
            }
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Failed to update profile", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
