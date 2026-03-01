import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      createdAt: true,
      isCreator: true,
      username: true,
      displayName: true,
      customAvatar: true,
      creatorBio: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    createdAt: user.createdAt.toISOString(),
    isCreator: user.isCreator,
    username: user.username,
    displayName: user.displayName,
    customAvatar: user.customAvatar,
    creatorBio: user.creatorBio,
  });
}
