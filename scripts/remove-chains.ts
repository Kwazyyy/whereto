import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

const PLACE_ID = "abd733f2-cb33-4aa7-8526-83eba5cfe2b4";

async function main() {
  // Get the place to find its googlePlaceId
  const place = await prisma.place.findUnique({
    where: { id: PLACE_ID },
    select: { id: true, name: true, address: true, googlePlaceId: true },
  });

  if (!place) {
    console.log(`Place ${PLACE_ID} not found — may already be deleted.`);
    return;
  }

  console.log(`\nDeleting: ${place.name} (${place.address})\n`);

  // Delete related records first
  const saves = await prisma.save.deleteMany({ where: { placeId: PLACE_ID } });
  console.log(`  Saves deleted: ${saves.count}`);

  const visits = await prisma.visit.deleteMany({ where: { placeId: PLACE_ID } });
  console.log(`  Visits deleted: ${visits.count}`);

  const recs = await prisma.recommendation.deleteMany({ where: { placeId: PLACE_ID } });
  console.log(`  Recommendations deleted: ${recs.count}`);

  const listItems = await prisma.curatedListItem.deleteMany({ where: { placeId: PLACE_ID } });
  console.log(`  CuratedListItems deleted: ${listItems.count}`);

  const photos = await prisma.placePhoto.deleteMany({ where: { placeId: PLACE_ID } });
  console.log(`  PlacePhotos deleted: ${photos.count}`);

  const analytics = await prisma.businessAnalytics.deleteMany({ where: { googlePlaceId: place.googlePlaceId } });
  console.log(`  BusinessAnalytics deleted: ${analytics.count}`);

  const placements = await prisma.featuredPlacement.deleteMany({ where: { googlePlaceId: place.googlePlaceId } });
  console.log(`  FeaturedPlacements deleted: ${placements.count}`);

  // Delete the place itself
  await prisma.place.delete({ where: { id: PLACE_ID } });
  console.log(`\n  Place deleted: ${place.name}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
