import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeIntent, intentLabel } from "@/lib/intents";

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

  // Count saves per normalized intent
  const intentCounts: Record<string, number> = {};
  for (const s of saves) {
    const key = normalizeIntent(s.intent);
    intentCounts[key] = (intentCounts[key] || 0) + 1;
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
      name: intentLabel(intent),
      percentage: Math.round((count / totalSaves) * 100),
    }));

  return NextResponse.json({
    score,
    topIntents,
    totalSaves,
    totalCategories: uniqueIntents,
  });
}
