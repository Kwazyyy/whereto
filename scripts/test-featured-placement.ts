/**
 * Create a test FeaturedPlacement to verify the system works.
 *
 * Usage:  npx tsx scripts/test-featured-placement.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Find a highly-rated place with a photo
  const place = await prisma.place.findFirst({
    where: {
      rating: { gte: 4.5 },
      photoUrl: { not: null },
    },
    orderBy: { rating: "desc" },
  });

  if (!place) {
    console.error("No suitable place found (rating >= 4.5 with photo)");
    process.exit(1);
  }

  console.log(`Found place: ${place.name} (${place.googlePlaceId}), rating: ${place.rating}`);

  // 2. Find a user with admin or business role, fallback to any user
  let user = await prisma.user.findFirst({
    where: { role: { in: ["admin", "business"] } },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      select: { id: true, email: true, role: true },
    });
  }

  if (!user) {
    console.error("No users found in database");
    process.exit(1);
  }

  console.log(`Using user: ${user.email} (role: ${user.role})`);

  // 3. Create the FeaturedPlacement
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const placement = await prisma.featuredPlacement.create({
    data: {
      googlePlaceId: place.googlePlaceId,
      businessName: place.name,
      userId: user.id,
      intents: [
        "Trending Now",
        "Date/Chill",
        "Budget Eats",
        "Desserts",
        "Study/Work",
        "Quiet Cafes",
        "Laptop-Friendly",
        "Group Hangouts",
        "Coffee & Catch-Up",
        "Outdoor/Patio",
      ],
      status: "active",
      startDate: new Date(),
      endDate,
    },
  });

  // 4. Log result
  console.log(`\nCreated FeaturedPlacement:`);
  console.log(`  ID: ${placement.id}`);
  console.log(`  Place: ${place.name}`);
  console.log(`  Status: ${placement.status}`);
  console.log(`  Intents: ${(placement.intents as string[]).join(", ")}`);
}

main().catch(console.error);
