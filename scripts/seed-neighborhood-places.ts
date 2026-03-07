/**
 * One-time seed script: populate the Place table with top cafes & restaurants
 * for each Toronto neighborhood so the exploration challenge system has data.
 *
 * Usage:  npx tsx scripts/seed-neighborhood-places.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { torontoNeighborhoods } from "../lib/neighborhoods";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local");
  process.exit(1);
}

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.photos,places.types";

// Map Google's price level enum strings to integers
const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function buildPhotoUrl(photoName: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${API_KEY}`;
}

function determinePlaceType(types: string[]): string {
  if (types.includes("cafe")) return "cafe";
  return "restaurant";
}

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  priceLevel?: string;
  photos?: { name: string }[];
  types?: string[];
}

async function searchPlaces(neighborhoodName: string, lat: number, lng: number): Promise<GooglePlace[]> {
  const body = {
    textQuery: `best cafes and restaurants in ${neighborhoodName} Toronto`,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 1500.0,
      },
    },
    maxResultCount: 7,
  };

  const res = await fetch(PLACES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  API error for ${neighborhoodName}: ${res.status} ${text}`);
    return [];
  }

  const data = await res.json();
  return data.places ?? [];
}

async function main() {
  let totalSeeded = 0;

  console.log(`Starting seed for ${torontoNeighborhoods.length} neighborhoods...\n`);

  for (const hood of torontoNeighborhoods) {
    const places = await searchPlaces(hood.name, hood.center.lat, hood.center.lng);
    console.log(`Seeding ${hood.name}... found ${places.length} places`);

    for (const p of places) {
      if (!p.location || !p.displayName?.text || !p.formattedAddress) continue;

      // Strip "places/" prefix from Google's place ID if present
      const googlePlaceId = p.id.startsWith("places/") ? p.id.slice(7) : p.id;

      // Pick a photo — prefer index 1-3 (non-primary), fall back to 0
      let photoUrl: string | null = null;
      if (p.photos && p.photos.length > 0) {
        const photoIndex = p.photos.length > 1 ? 1 : 0;
        photoUrl = buildPhotoUrl(p.photos[photoIndex].name);
      }

      await prisma.place.upsert({
        where: { googlePlaceId },
        update: {
          name: p.displayName.text,
          lat: p.location.latitude,
          lng: p.location.longitude,
          address: p.formattedAddress,
          rating: p.rating ?? null,
          priceLevel: p.priceLevel ? (PRICE_MAP[p.priceLevel] ?? null) : null,
          photoUrl,
          placeType: determinePlaceType(p.types ?? []),
        },
        create: {
          googlePlaceId,
          name: p.displayName.text,
          lat: p.location.latitude,
          lng: p.location.longitude,
          address: p.formattedAddress,
          rating: p.rating ?? null,
          priceLevel: p.priceLevel ? (PRICE_MAP[p.priceLevel] ?? null) : null,
          photoUrl,
          placeType: determinePlaceType(p.types ?? []),
          vibeTags: [],
        },
      });

      totalSeeded++;
    }

    // Rate limit: 500ms between neighborhoods
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone! Seeded ${totalSeeded} total places across ${torontoNeighborhoods.length} neighborhoods.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
