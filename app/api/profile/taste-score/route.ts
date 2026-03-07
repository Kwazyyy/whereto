import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const INTENT_LABELS: Record<string, string> = {
  study: "Study / Work",
  date: "Date / Chill",
  trending: "Trending Now",
  quiet: "Quiet Cafes",
  laptop: "Laptop-Friendly",
  group: "Group Hangouts",
  budget: "Budget Eats",
  coffee: "Coffee & Catch-Up",
  outdoor: "Outdoor / Patio",
  recs_from_friends: "Friend Recs",
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saves = await prisma.save.findMany({
    where: { userId: session.user.id },
    select: { intent: true },
  });

  if (saves.length === 0) {
    return NextResponse.json({
      score: 0,
      topIntents: [],
      totalSaves: 0,
      totalCategories: 0,
    });
  }

  // Count saves per intent
  const intentCounts: Record<string, number> = {};
  for (const s of saves) {
    intentCounts[s.intent] = (intentCounts[s.intent] || 0) + 1;
  }

  const totalSaves = saves.length;
  const uniqueIntents = Object.keys(intentCounts).length;

  // Score: diversity of intents * 50 (out of 9 possible) + volume bonus (capped at 50)
  const diversityScore = (uniqueIntents / 9) * 50;
  const volumeScore = Math.min(totalSaves, 50);
  const score = Math.min(100, Math.round(diversityScore + volumeScore));

  // All intents sorted by count
  const topIntents = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([intent, count]) => ({
      id: intent,
      name: INTENT_LABELS[intent] || intent,
      percentage: Math.round((count / totalSaves) * 100),
    }));

  return NextResponse.json({
    score,
    topIntents,
    totalSaves,
    totalCategories: uniqueIntents,
  });
}
