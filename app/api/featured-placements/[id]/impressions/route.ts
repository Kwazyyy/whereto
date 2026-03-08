import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  if (!["impression", "swipe_right", "swipe_left"].includes(action)) {
    return NextResponse.json(
      { error: "action must be impression, swipe_right, or swipe_left" },
      { status: 400 }
    );
  }

  const incrementField =
    action === "impression"
      ? "impressions"
      : action === "swipe_right"
        ? "swipeRights"
        : "swipeLefts";

  try {
    await prisma.featuredPlacement.update({
      where: { id },
      data: { [incrementField]: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Placement not found" },
      { status: 404 }
    );
  }
}
