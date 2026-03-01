import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

// GET /api/profile/check-username?username=XXX
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const usernameParam = searchParams.get("username");

    if (!usernameParam) {
        return NextResponse.json({ available: false, error: "Username is required" }, { status: 400 });
    }

    const lowerUsername = usernameParam.toLowerCase().trim();

    if (!USERNAME_REGEX.test(lowerUsername)) {
        return NextResponse.json({ available: false, error: "Invalid format" }, { status: 400 });
    }

    try {
        const existing = await prisma.user.findFirst({
            where: {
                username: lowerUsername,
                id: { not: session.user.id }
            },
        });

        if (existing) {
            return NextResponse.json({ available: false });
        }

        return NextResponse.json({ available: true });
    } catch (error) {
        console.error("Failed to check username", error);
        return NextResponse.json({ available: false, error: String(error) }, { status: 500 });
    }
}
