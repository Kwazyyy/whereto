import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

  const statusFilter = req.nextUrl.searchParams.get("status");

  const placements = await prisma.featuredPlacement.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = placements.map((p) => ({
    id: p.id,
    googlePlaceId: p.googlePlaceId,
    businessName: p.businessName,
    userEmail: p.user.email,
    userName: p.user.name,
    intents: p.intents,
    status: p.status,
    startDate: p.startDate,
    endDate: p.endDate,
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
  const { id, status } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (status !== "revoked") {
    return NextResponse.json({ error: "Only 'revoked' status is allowed" }, { status: 400 });
  }

  try {
    const updated = await prisma.featuredPlacement.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ placement: updated });
  } catch {
    return NextResponse.json({ error: "Placement not found" }, { status: 404 });
  }
}
