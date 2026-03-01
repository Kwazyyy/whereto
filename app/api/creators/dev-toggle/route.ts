import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
    if (process.env.NODE_ENV !== "development") {
        return new NextResponse("Not Found", { status: 404 });
    }

    try {
        const session = await auth();
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isCreator: true } });
        const toggled = !(user?.isCreator || false);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { isCreator: toggled }
        });

        return NextResponse.json({ success: true, isCreator: toggled });
    } catch (e) {
        console.error(e);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
