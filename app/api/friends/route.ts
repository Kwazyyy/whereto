import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/friends
// Returns accepted friends, pending incoming requests, and pending outgoing requests
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [accepted, pendingReceived, pendingSent] = await Promise.all([
    // Accepted friendships (either direction)
    prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender:   { select: { id: true, name: true, email: true, image: true } },
        receiver: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Incoming pending requests
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "pending" },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Outgoing pending requests
    prisma.friendship.findMany({
      where: { senderId: userId, status: "pending" },
      include: {
        receiver: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const friends = accepted.map((f) => {
    const friend = f.senderId === userId ? f.receiver : f.sender;
    return {
      friendshipId: f.id,
      userId: friend.id,
      name: friend.name,
      email: friend.email,
      image: friend.image,
      friendsSince: f.createdAt.toISOString(),
    };
  });

  const incoming = pendingReceived.map((f) => ({
    friendshipId: f.id,
    userId: f.sender.id,
    name: f.sender.name,
    email: f.sender.email,
    image: f.sender.image,
    sentAt: f.createdAt.toISOString(),
  }));

  const outgoing = pendingSent.map((f) => ({
    friendshipId: f.id,
    userId: f.receiver.id,
    name: f.receiver.name,
    email: f.receiver.email,
    sentAt: f.createdAt.toISOString(),
  }));

  return NextResponse.json({ friends, incoming, outgoing });
}

// POST /api/friends
// Send a friend request by email
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json() as { email: string };
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const senderId = session.user.id;

  const target = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true },
  });

  if (!target) {
    return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
  }

  if (target.id === senderId) {
    return NextResponse.json({ error: "You can't add yourself" }, { status: 400 });
  }

  // Check if a friendship already exists in either direction
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId, receiverId: target.id },
        { senderId: target.id, receiverId: senderId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "accepted") {
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    }
    if (existing.status === "pending") {
      return NextResponse.json({ error: "Friend request already sent" }, { status: 409 });
    }
    // If declined, allow re-sending by updating the existing record
    const updated = await prisma.friendship.update({
      where: { id: existing.id },
      data: { status: "pending", senderId, receiverId: target.id, createdAt: new Date() },
    });
    return NextResponse.json({ friendshipId: updated.id });
  }

  const friendship = await prisma.friendship.create({
    data: { senderId, receiverId: target.id, status: "pending" },
  });

  return NextResponse.json({ friendshipId: friendship.id }, { status: 201 });
}

// PATCH /api/friends
// Accept or decline a friend request
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendshipId, action } = await req.json() as {
    friendshipId: string;
    action: "accept" | "decline";
  };

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only the receiver can accept or decline
  if (friendship.receiverId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: action === "accept" ? "accepted" : "declined" },
  });

  return NextResponse.json({ friendshipId: updated.id, status: updated.status });
}

// DELETE /api/friends
// Remove a friend or cancel/withdraw a request
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendshipId } = await req.json() as { friendshipId: string };

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Either party can remove
  if (friendship.senderId !== session.user.id && friendship.receiverId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });

  return NextResponse.json({ ok: true });
}
