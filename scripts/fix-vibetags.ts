import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

async function main() {
  const places = await prisma.place.findMany();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  VIBE TAG FIXES`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\nTotal places: ${places.length}\n`);

  const updates: { id: string; vibeTags: string[] }[] = [];

  function getTags(place: typeof places[number]): string[] {
    const vt = place.vibeTags;
    if (vt && Array.isArray(vt)) return [...(vt as string[])];
    return [];
  }

  function queueUpdate(id: string, tags: string[]) {
    const existing = updates.find((u) => u.id === id);
    if (existing) {
      existing.vibeTags = tags;
    } else {
      updates.push({ id, vibeTags: tags });
    }
  }

  // Working copy of tags per place (so sequential fixes stack)
  const tagMap = new Map<string, string[]>();
  for (const p of places) {
    tagMap.set(p.id, getTags(p));
  }

  // ─── Fix 1: Copacabana (0-tag place) ───
  console.log(`--- Fix 1: Copacabana Brazilian Steakhouse ---\n`);
  let fix1Count = 0;
  for (const p of places) {
    if (p.name.toLowerCase().includes("copacabana")) {
      const newTags = ["date", "trending", "groups"];
      tagMap.set(p.id, newTags);
      queueUpdate(p.id, newTags);
      console.log(`  Set tags: ${p.name} → [${newTags.join(", ")}]`);
      fix1Count++;
    }
  }
  if (fix1Count === 0) console.log(`  No match found.`);
  console.log(`  Modified: ${fix1Count}\n`);

  // ─── Fix 2: Remove "date" from BBQ/burger places ───
  console.log(`--- Fix 2: Remove "date" from BBQ/burger places ---\n`);
  const bbqPattern = /\b(bbq|barbecue|burger|wings?|ribs?|grill)\b/i;
  let fix2Count = 0;
  for (const p of places) {
    const tags = tagMap.get(p.id)!;
    if (tags.includes("date") && bbqPattern.test(p.name)) {
      const newTags = tags.filter((t) => t !== "date");
      tagMap.set(p.id, newTags);
      queueUpdate(p.id, newTags);
      console.log(`  Removed "date": ${p.name} → [${newTags.join(", ")}]`);
      fix2Count++;
    }
  }
  if (fix2Count === 0) console.log(`  No matches.`);
  console.log(`  Modified: ${fix2Count}\n`);

  // ─── Fix 3: Remove "date" from hookah bars ───
  console.log(`--- Fix 3: Remove "date" from hookah bars ---\n`);
  let fix3Count = 0;
  for (const p of places) {
    if (p.placeType.toLowerCase().includes("hookah")) {
      const tags = tagMap.get(p.id)!;
      if (tags.includes("date")) {
        const newTags = tags.filter((t) => t !== "date");
        tagMap.set(p.id, newTags);
        queueUpdate(p.id, newTags);
        console.log(`  Removed "date": ${p.name} → [${newTags.join(", ")}]`);
        fix3Count++;
      }
    }
  }
  if (fix3Count === 0) console.log(`  No matches.`);
  console.log(`  Modified: ${fix3Count}\n`);

  // ─── Fix 4: Remove "groups" from upscale restaurants ───
  console.log(`--- Fix 4: Remove "groups" from upscale ($$$/$$$$) places ---\n`);
  let fix4Count = 0;
  for (const p of places) {
    if (p.priceLevel !== null && p.priceLevel >= 3) {
      const tags = tagMap.get(p.id)!;
      if (tags.includes("groups")) {
        const newTags = tags.filter((t) => t !== "groups");
        tagMap.set(p.id, newTags);
        queueUpdate(p.id, newTags);
        console.log(`  Removed "groups": ${p.name} (price: ${p.priceLevel}) → [${newTags.join(", ")}]`);
        fix4Count++;
      }
    }
  }
  if (fix4Count === 0) console.log(`  No matches.`);
  console.log(`  Modified: ${fix4Count}\n`);

  // ─── Fix 5: Add "date" to steakhouses ───
  console.log(`--- Fix 5: Add "date" to steakhouses ---\n`);
  let fix5Count = 0;
  for (const p of places) {
    if (p.placeType.toLowerCase().includes("steak")) {
      const tags = tagMap.get(p.id)!;
      let changed = false;
      if (!tags.includes("date")) {
        tags.push("date");
        changed = true;
      }
      if (p.rating !== null && p.rating >= 4.5 && !tags.includes("trending")) {
        tags.push("trending");
        changed = true;
      }
      if (changed) {
        tagMap.set(p.id, tags);
        queueUpdate(p.id, tags);
        console.log(`  Added tags: ${p.name} → [${tags.join(", ")}]`);
        fix5Count++;
      }
    }
  }
  if (fix5Count === 0) console.log(`  No matches.`);
  console.log(`  Modified: ${fix5Count}\n`);

  // ─── Write all updates ───
  console.log(`--- Writing ${updates.length} updates to database ---\n`);
  for (const u of updates) {
    await prisma.place.update({
      where: { id: u.id },
      data: { vibeTags: u.vibeTags },
    });
  }
  console.log(`  Done.\n`);

  // ─── Final summary ───
  console.log(`${"=".repeat(60)}`);
  console.log(`  UPDATED TAG DISTRIBUTION`);
  console.log(`${"=".repeat(60)}\n`);

  const tagCounts = new Map<string, number>();
  let totalTags = 0;
  let zeroTagCount = 0;
  for (const [, tags] of tagMap) {
    if (tags.length === 0) zeroTagCount++;
    totalTags += tags.length;
    for (const t of tags) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }

  console.log(`Places with 0 tags: ${zeroTagCount}`);
  console.log(`Average tags per place: ${(totalTags / places.length).toFixed(1)}\n`);

  const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [tag, count] of sorted) {
    const bar = "#".repeat(Math.min(Math.round(count / 2), 60));
    console.log(`  ${tag.padEnd(12)} ${String(count).padStart(4)}  ${bar}`);
  }

  // ─── Updated date list ───
  console.log(`\n--- All "date" tagged places (updated) ---\n`);
  let dateCount = 0;
  for (const p of places) {
    const tags = tagMap.get(p.id)!;
    if (tags.includes("date")) {
      console.log(`  ${p.name.padEnd(50)} type: ${p.placeType.padEnd(25)} tags: [${tags.join(", ")}]`);
      dateCount++;
    }
  }
  console.log(`\n  Total date-tagged: ${dateCount}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
