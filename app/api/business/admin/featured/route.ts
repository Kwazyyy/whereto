import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (adminUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const placements = await prisma.featuredPlacement.findMany({
    include: {
      place: { select: { name: true, photoUrl: true } },
      businessUser: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = placements.map((p) => ({
    id: p.id,
    googlePlaceId: p.googlePlaceId,
    placeName: p.place.name,
    placePhoto: p.place.photoUrl,
    businessUser: p.businessUser.name ?? p.businessUser.email,
    intents: p.intents,
    status: p.status,
    priority: p.priority,
    startDate: p.startDate,
    endDate: p.endDate,
    impressions: p.impressions,
    swipeRights: p.swipeRights,
    swipeLefts: p.swipeLefts,
    ctr: p.impressions > 0
      ? Math.round((p.swipeRights / p.impressions) * 10000) / 100
      : 0,
    createdAt: p.createdAt,
  }));

  return NextResponse.json({ placements: result });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (adminUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, priority, endDate } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (priority !== undefined) data.priority = priority;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

  try {
    const updated = await prisma.featuredPlacement.update({
      where: { id },
      data,
    });

    return NextResponse.json({ placement: updated });
  } catch {
    return NextResponse.json(
      { error: "Placement not found" },
      { status: 404 }
    );
  }
}
