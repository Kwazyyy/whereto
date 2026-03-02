import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      adminSecret?: string;
    };

    const { email, adminSecret } = body;

    if (!email || !adminSecret) {
      return NextResponse.json(
        { error: "email and adminSecret are required" },
        { status: 400 }
      );
    }

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Invalid admin secret" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Make admin error:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
