import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

const ROMANTIC_NAME_SIGNALS = /\b(bistro|wine|cocktail|tapas|fine|elegant|intimate|lounge|steakhouse|sushi|french|italian|mediterranean|spanish)\b/i;

async function main() {
  const places = await prisma.place.findMany();

  const romanticPlaces = places.filter((p) => {
    const tags = Array.isArray(p.vibeTags) ? (p.vibeTags as string[]) : [];
    return tags.includes("romantic");
  });

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  FIX ROMANTIC — remove null-priceLevel fallback qualifiers`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\nTotal places with romantic tag: ${romanticPlaces.length}\n`);

  const removed: { name: string; type: string; rating: number | null; price: number | null }[] = [];
  const kept: { name: string; type: string; rating: number | null; price: number | null }[] = [];
  const updates: { id: string; vibeTags: string[] }[] = [];

  for (const p of romanticPlaces) {
    const tags = [...(p.vibeTags as string[])];

    // Check if this place only qualified via null priceLevel rule
    const isNullPriceFallback =
      p.priceLevel === null &&
      p.rating !== null &&
      p.rating >= 4.5 &&
      p.placeType.toLowerCase().includes("restaurant");

    if (!isNullPriceFallback) {
      // Qualified via price 3/4 or price 2 + name signal — keep it
      kept.push({ name: p.name, type: p.placeType, rating: p.rating, price: p.priceLevel });
      continue;
    }

    // Null price fallback — check for name signals
    if (ROMANTIC_NAME_SIGNALS.test(p.name)) {
      kept.push({ name: p.name, type: p.placeType, rating: p.rating, price: p.priceLevel });
      continue;
    }

    // Remove romantic
    const newTags = tags.filter((t) => t !== "romantic");

    // If no tags left, add chill as fallback
    if (newTags.length === 0) {
      newTags.push("chill");
    }

    updates.push({ id: p.id, vibeTags: newTags });
    removed.push({ name: p.name, type: p.placeType, rating: p.rating, price: p.priceLevel });
  }

  // Write updates
  console.log(`--- Writing ${updates.length} updates to database ---\n`);
  for (const u of updates) {
    await prisma.place.update({
      where: { id: u.id },
      data: { vibeTags: u.vibeTags },
    });
  }
  console.log(`  Done.\n`);

  // Summary
  const newRomanticCount = romanticPlaces.length - removed.length;
  console.log(`${"=".repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`  Romantic removed from:     ${removed.length} places`);
  console.log(`  Romantic kept:             ${kept.length} places`);
  console.log(`  New romantic count:        ${newRomanticCount} ${newRomanticCount >= 200 && newRomanticCount <= 400 ? "OK" : "REVIEW"}\n`);

  // Samples
  console.log(`--- 10 sample places that KEPT romantic ---\n`);
  for (const s of kept.slice(0, 10)) {
    console.log(`  ${s.name.padEnd(50)} type: ${s.type.padEnd(25)} r: ${s.rating ?? "?"} p: ${s.price ?? "?"}`);
  }

  console.log(`\n--- 10 sample places that LOST romantic ---\n`);
  for (const s of removed.slice(0, 10)) {
    console.log(`  ${s.name.padEnd(50)} type: ${s.type.padEnd(25)} r: ${s.rating ?? "?"} p: ${s.price ?? "?"}`);
  }

  console.log();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
