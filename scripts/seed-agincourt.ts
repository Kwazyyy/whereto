/**
 * Targeted seed: populate Place table for Agincourt neighborhood.
 * Tries multiple queries to ensure we get places within the area.
 *
 * Usage:  npx tsx scripts/seed-agincourt.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

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

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

// Agincourt bounds: lat ~43.78-43.80, lng ~-79.30 to -79.26
const AGINCOURT_CENTER = { lat: 43.7890, lng: -79.2810 };
const AGINCOURT_BOUNDS = { minLat: 43.775, maxLat: 43.805, minLng: -79.305, maxLng: -79.255 };

const QUERIES = [
  "restaurants near Agincourt Mall, Scarborough, Toronto",
  "cafes near Sheppard and Midland, Scarborough, Toronto",
  "restaurants Sheppard Avenue East Scarborough Toronto",
];

function buildPhotoUrl(photoName: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${API_KEY}`;
}

function determinePlaceType(types: string[]): string {
  if (types.includes("cafe")) return "cafe";
  return "restaurant";
}

function isInAgincourt(lat: number, lng: number): boolean {
  return (
    lat >= AGINCOURT_BOUNDS.minLat &&
    lat <= AGINCOURT_BOUNDS.maxLat &&
    lng >= AGINCOURT_BOUNDS.minLng &&
    lng <= AGINCOURT_BOUNDS.maxLng
  );
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

async function searchPlaces(query: string): Promise<GooglePlace[]> {
  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: AGINCOURT_CENTER.lat, longitude: AGINCOURT_CENTER.lng },
        radius: 2000.0,
      },
    },
    maxResultCount: 10,
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
    console.error(`  API error: ${res.status} ${text}`);
    return [];
  }

  const data = await res.json();
  return data.places ?? [];
}

async function main() {
  const seededIds = new Set<string>();

  for (const query of QUERIES) {
    if (seededIds.size >= 7) break;

    console.log(`Searching: "${query}"...`);
    const places = await searchPlaces(query);
    console.log(`  Found ${places.length} results`);

    for (const p of places) {
      if (seededIds.size >= 7) break;
      if (!p.location || !p.displayName?.text || !p.formattedAddress) continue;

      const googlePlaceId = p.id.startsWith("places/") ? p.id.slice(7) : p.id;
      if (seededIds.has(googlePlaceId)) continue;

      // Check if place is within Agincourt bounds
      if (!isInAgincourt(p.location.latitude, p.location.longitude)) {
        console.log(`  Skipping "${p.displayName.text}" — outside Agincourt (${p.location.latitude}, ${p.location.longitude})`);
        continue;
      }

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

      seededIds.add(googlePlaceId);
      console.log(`  Seeded: "${p.displayName.text}" (${p.location.latitude}, ${p.location.longitude})`);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone! Seeded ${seededIds.size} places for Agincourt.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
