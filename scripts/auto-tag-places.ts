import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

function assignTags(place: {
  name: string;
  placeType: string;
  rating: number | null;
  priceLevel: number | null;
}): string[] {
  const tags = new Set<string>();
  const type = place.placeType.toLowerCase();
  const nameLower = place.name.toLowerCase();
  const rating = place.rating ?? 0;
  const price = place.priceLevel;

  // ─── study ───
  const studyTypes = ["cafe", "coffee shop", "bakery"];
  const antiStudyTypes = ["restaurant", "bar", "pub", "lounge", "steak", "grill", "hookah"];
  const isAntiStudy = antiStudyTypes.some((t) => type.includes(t));

  if (!isAntiStudy) {
    if (studyTypes.some((t) => type.includes(t))) {
      tags.add("study");
    }
    if (/\b(library|study|work|cowork|books)\b/i.test(nameLower)) {
      tags.add("study");
    }
  }

  // ─── date ───
  const dateTypes = [
    "restaurant", "steakhouse", "steak house", "lounge", "wine bar",
    "cocktail bar", "bistro", "italian restaurant", "french restaurant",
    "japanese restaurant", "sushi restaurant", "fine dining",
  ];
  const antiDateTypes = ["cafe", "coffee shop", "bakery", "fast", "takeout"];
  const isAntiDate = antiDateTypes.some((t) => type.includes(t));

  if (!isAntiDate) {
    const isDateType = dateTypes.some((t) => type.includes(t));
    const isDateName = /\b(lounge|bistro|wine|cocktail|intimate|romance)\b/i.test(nameLower);
    const isDateRating = rating >= 4.3;
    const isDatePrice = price !== null && price >= 2;

    if ((isDateType && isDateRating && isDatePrice) || isDateName) {
      tags.add("date");
    }
  }

  // ─── trending ───
  if (rating >= 4.5) {
    tags.add("trending");
  }

  // ─── quiet ───
  const quietTypes = ["cafe", "coffee shop", "bakery", "tea house", "tea room"];
  const antiQuietTypes = ["bar", "pub", "hookah", "grill"];
  const antiQuietName = /\b(sports|grill)\b/i.test(nameLower);
  const isAntiQuiet = antiQuietTypes.some((t) => type.includes(t)) || antiQuietName;

  if (!isAntiQuiet && quietTypes.some((t) => type.includes(t))) {
    tags.add("quiet");
  }

  // ─── groups ───
  const groupTypes = ["restaurant", "pub", "bar", "hookah", "pizza", "burger", "korean bbq", "bbq", "grill"];
  const groupNameKeywords = /\b(grill|sports|pub|bar|patio|garden|bbq|pizza|wings)\b/i;
  const isGroupPrice = price !== null && price <= 2;

  if (groupTypes.some((t) => type.includes(t)) || groupNameKeywords.test(nameLower)) {
    if (isGroupPrice || price === null) {
      tags.add("groups");
    }
  }

  // ─── budget ───
  const budgetTypes = [
    "fast", "shawarma", "falafel", "ramen", "noodle", "dumpling",
    "taco", "burrito", "pizza", "pho", "banh mi", "deli", "bakery",
  ];
  const budgetName = /\b(cheap|deal|special|combo|express|quick)\b/i;

  if (price === 1) {
    tags.add("budget");
  } else if (budgetTypes.some((t) => type.includes(t))) {
    tags.add("budget");
  } else if (budgetName.test(nameLower)) {
    tags.add("budget");
  }

  // ─── coffee ───
  const coffeeTypes = ["cafe", "coffee shop", "bakery", "dessert", "ice cream"];
  const coffeeName = /\b(coffee|espresso|brew|roast|latte|cafe|café|bakery|pastry|donut|doughnut)\b/i;

  if (coffeeTypes.some((t) => type.includes(t)) || coffeeName.test(nameLower)) {
    tags.add("coffee");
  }

  // ─── outdoor ───
  if (/\b(patio|garden|terrace|rooftop|outdoor|park)\b/i.test(nameLower)) {
    tags.add("outdoor");
  }

  // ─── Fallback: 0 tags ───
  if (tags.size === 0) {
    if (type.includes("cafe") || type.includes("coffee shop") || type.includes("bakery")) {
      tags.add("coffee");
      tags.add("quiet");
    } else if (type.includes("restaurant")) {
      if (rating >= 4.5) tags.add("trending");
      else tags.add("groups");
    } else if (type.includes("bar") || type.includes("pub")) {
      tags.add("groups");
    } else {
      if (rating >= 4.5) tags.add("trending");
      // else: truly untaggable — will be reported
    }
  }

  return [...tags];
}

async function main() {
  const places = await prisma.place.findMany();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  AUTO-TAG PLACES`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\nTotal places: ${places.length}\n`);

  // Normalize placeType casing
  let caseFixCount = 0;
  for (const p of places) {
    const lower = p.placeType.toLowerCase();
    if (lower !== p.placeType) caseFixCount++;
    p.placeType = lower;
  }
  console.log(`placeType case fixes: ${caseFixCount}\n`);

  // Assign tags
  const results: { id: string; name: string; placeType: string; tags: string[]; normalizedType: string }[] = [];
  for (const p of places) {
    const tags = assignTags(p);
    results.push({ id: p.id, name: p.name, placeType: p.placeType, tags, normalizedType: p.placeType });
  }

  // Write to database
  console.log(`Writing tags and normalized placeType to database...\n`);
  let updated = 0;
  for (const r of results) {
    await prisma.place.update({
      where: { id: r.id },
      data: {
        vibeTags: r.tags,
        placeType: r.normalizedType,
      },
    });
    updated++;
  }
  console.log(`Updated: ${updated} places\n`);

  // ─── Report ───
  console.log(`${"=".repeat(60)}`);
  console.log(`  REPORT`);
  console.log(`${"=".repeat(60)}\n`);

  // Distribution
  const tagCounts = new Map<string, number>();
  let totalTags = 0;
  const warnings: string[] = [];

  for (const r of results) {
    if (r.tags.length === 0) {
      warnings.push(`  [0 tags] ${r.name} — type: ${r.placeType}`);
    }
    totalTags += r.tags.length;
    for (const t of r.tags) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }

  console.log(`Total places tagged: ${results.filter((r) => r.tags.length > 0).length} / ${results.length}`);
  console.log(`Average tags per place: ${(totalTags / results.length).toFixed(1)}\n`);

  console.log(`--- Tag Distribution ---\n`);
  const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [tag, count] of sorted) {
    const bar = "#".repeat(Math.min(Math.round(count / 2), 60));
    console.log(`  ${tag.padEnd(12)} ${String(count).padStart(4)}  ${bar}`);
  }

  if (warnings.length > 0) {
    console.log(`\n--- Warnings: ${warnings.length} places with 0 tags ---\n`);
    for (const w of warnings) console.log(w);
  } else {
    console.log(`\nNo warnings — all places have at least 1 tag.`);
  }

  // Sample places
  console.log(`\n--- Sample Places (5 random) ---\n`);
  const shuffled = [...results].sort(() => Math.random() - 0.5);
  for (const r of shuffled.slice(0, 5)) {
    console.log(`  ${r.name.padEnd(45)} → [${r.tags.join(", ")}]`);
  }

  // All "date" tagged places
  const datePlaces = results.filter((r) => r.tags.includes("date"));
  console.log(`\n--- All "date" tagged places (${datePlaces.length}) ---\n`);
  for (const r of datePlaces) {
    console.log(`  ${r.name.padEnd(45)} type: ${r.placeType.padEnd(25)} tags: [${r.tags.join(", ")}]`);
  }

  console.log("");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
