/**
 * Targeted seed: populate Place table for Agincourt and Riverdale
 * (neighborhoods that were missed in the initial seed).
 *
 * Usage:  npx tsx scripts/seed-missing-neighborhoods.ts
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

const MISSING_NEIGHBORHOODS = [
  { name: "Agincourt", query: "Agincourt, Scarborough, Toronto", lat: 43.7890, lng: -79.2810 },
  { name: "Riverdale", query: "Riverdale, Toronto", lat: 43.6685, lng: -79.3470 },
];

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

async function searchPlaces(query: string, lat: number, lng: number): Promise<GooglePlace[]> {
  const body = {
    textQuery: `best cafes and restaurants in ${query}`,
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
    console.error(`  API error for ${query}: ${res.status} ${text}`);
    return [];
  }

  const data = await res.json();
  return data.places ?? [];
}

async function main() {
  let totalSeeded = 0;

  for (const hood of MISSING_NEIGHBORHOODS) {
    const places = await searchPlaces(hood.query, hood.lat, hood.lng);
    console.log(`Seeding ${hood.name}... found ${places.length} places`);

    for (const p of places) {
      if (!p.location || !p.displayName?.text || !p.formattedAddress) continue;

      const googlePlaceId = p.id.startsWith("places/") ? p.id.slice(7) : p.id;

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

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone! Seeded ${totalSeeded} places for ${MISSING_NEIGHBORHOODS.map(h => h.name).join(", ")}.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
