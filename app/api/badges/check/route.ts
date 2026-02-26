import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAndAwardBadges } from "@/lib/checkBadges";
import { BADGE_DEFINITIONS } from "@/lib/badges";

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const newBadgeTypes = await checkAndAwardBadges(session.user.id);

        // Map the raw keys to the full definitions so the UI can render celebrations
        const newBadges = newBadgeTypes
            .map(type => BADGE_DEFINITIONS.find(b => b.type === type))
            .filter(Boolean);

        return NextResponse.json({ newBadges });
    } catch (e) {
        console.error("POST /api/badges/check Error:", e);
        return NextResponse.json({ error: "Failed to check badges" }, { status: 500 });
    }
}
