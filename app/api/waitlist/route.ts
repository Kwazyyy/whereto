import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: "Valid email is required" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingEntry = await prisma.waitlist.findUnique({
            where: { email },
        });

        if (existingEntry) {
            return NextResponse.json(
                { error: "Email is already on the waitlist" },
                { status: 409 }
            );
        }

        const waitlistEntry = await prisma.waitlist.create({
            data: {
                email,
            },
        });

        return NextResponse.json({ success: true, waitlistEntry });
    } catch (error) {
        console.error("Waitlist error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
