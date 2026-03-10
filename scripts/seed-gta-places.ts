import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.types,places.photos,places.websiteUri";

// ─── Search areas ───

const AREAS = [
  // Inner Toronto (fill gaps)
  { name: "Liberty Village Toronto", lat: 43.6387, lng: -79.4209 },
  { name: "Parkdale Toronto", lat: 43.6390, lng: -79.4480 },
  { name: "West Queen West Toronto", lat: 43.6435, lng: -79.4115 },
  { name: "Leslieville Toronto", lat: 43.6627, lng: -79.3285 },
  { name: "Riverside Toronto", lat: 43.6594, lng: -79.3437 },
  { name: "Danforth Toronto", lat: 43.6795, lng: -79.3510 },
  { name: "East York Toronto", lat: 43.6910, lng: -79.3280 },
  { name: "The Beaches Toronto", lat: 43.6708, lng: -79.2970 },
  { name: "Roncesvalles Toronto", lat: 43.6480, lng: -79.4510 },
  { name: "Bloordale Toronto", lat: 43.6601, lng: -79.4400 },
  { name: "Junction Toronto", lat: 43.6652, lng: -79.4680 },
  { name: "High Park Toronto", lat: 43.6535, lng: -79.4660 },

  // North York & North
  { name: "North York Centre", lat: 43.7615, lng: -79.4111 },
  { name: "Willowdale Toronto", lat: 43.7660, lng: -79.4080 },
  { name: "Thornhill Ontario", lat: 43.8150, lng: -79.4200 },
  { name: "Richmond Hill Ontario", lat: 43.8828, lng: -79.4403 },
  { name: "Markham Ontario", lat: 43.8561, lng: -79.3370 },
  { name: "Unionville Markham", lat: 43.8710, lng: -79.3150 },
  { name: "Newmarket Ontario", lat: 44.0592, lng: -79.4613 },
  { name: "Aurora Ontario", lat: 44.0065, lng: -79.4504 },
  { name: "Stouffville Ontario", lat: 43.9710, lng: -79.2440 },

  // West — Etobicoke, Vaughan, Brampton, Mississauga
  { name: "Etobicoke Toronto", lat: 43.6205, lng: -79.5132 },
  { name: "Mimico Toronto", lat: 43.6150, lng: -79.4930 },
  { name: "Islington Etobicoke", lat: 43.6370, lng: -79.5250 },
  { name: "Vaughan Ontario", lat: 43.8361, lng: -79.4983 },
  { name: "Woodbridge Vaughan", lat: 43.7790, lng: -79.5940 },
  { name: "Brampton Ontario", lat: 43.7315, lng: -79.7624 },
  { name: "Brampton Downtown", lat: 43.6834, lng: -79.7593 },
  { name: "Caledon Ontario", lat: 43.8681, lng: -79.8726 },
  { name: "Mississauga City Centre", lat: 43.5890, lng: -79.6441 },
  { name: "Port Credit Mississauga", lat: 43.5510, lng: -79.5850 },
  { name: "Streetsville Mississauga", lat: 43.5820, lng: -79.7110 },
  { name: "Meadowvale Mississauga", lat: 43.5920, lng: -79.7580 },
  { name: "Oakville Ontario", lat: 43.4675, lng: -79.6877 },
  { name: "Burlington Ontario", lat: 43.3255, lng: -79.7990 },
  { name: "Milton Ontario", lat: 43.5183, lng: -79.8774 },
  { name: "Georgetown Ontario", lat: 43.6526, lng: -79.9193 },

  // East — Scarborough, Pickering, Ajax, Oshawa
  { name: "Scarborough Town Centre", lat: 43.7764, lng: -79.2578 },
  { name: "Scarborough Bluffs", lat: 43.7110, lng: -79.2310 },
  { name: "Agincourt Scarborough", lat: 43.7990, lng: -79.2810 },
  { name: "Pickering Ontario", lat: 43.8354, lng: -79.0890 },
  { name: "Ajax Ontario", lat: 43.8509, lng: -79.0204 },
  { name: "Whitby Ontario", lat: 43.8975, lng: -78.9429 },
  { name: "Oshawa Ontario", lat: 43.8971, lng: -78.8658 },

  // Hamilton & Niagara
  { name: "Hamilton Ontario downtown", lat: 43.2557, lng: -79.8711 },
  { name: "Hamilton James Street", lat: 43.2600, lng: -79.8680 },
  { name: "Dundas Hamilton", lat: 43.2660, lng: -79.9560 },
  { name: "St Catharines Ontario", lat: 43.1594, lng: -79.2469 },
  { name: "Niagara Falls Ontario", lat: 43.0896, lng: -79.0849 },
  { name: "Niagara-on-the-Lake Ontario", lat: 43.2550, lng: -79.0716 },
  { name: "Welland Ontario", lat: 42.9863, lng: -79.2486 },

  // Other Southern Ontario
  { name: "Guelph Ontario", lat: 43.5448, lng: -80.2482 },
  { name: "Kitchener Ontario", lat: 43.4516, lng: -80.4925 },
  { name: "Waterloo Ontario", lat: 43.4643, lng: -80.5204 },
  { name: "Barrie Ontario", lat: 44.3894, lng: -79.6903 },
  { name: "Cambridge Ontario", lat: 43.3616, lng: -80.3144 },
];

const QUERY_TEMPLATES = [
  "best cafes in {area}",
  "best restaurants in {area}",
  "romantic restaurants in {area}",
  "brunch spots in {area}",
];

// ─── Chain blocklist ───

const CHAIN_BLOCKLIST = [
  "McDonald's", "Burger King", "Wendy's", "Subway", "Pizza Pizza",
  "Popeyes", "KFC", "Taco Bell", "A&W", "Harvey's", "Five Guys",
  "Chick-fil-A", "Dairy Queen", "IHOP", "Waffle House", "Papa John's",
  "Domino's", "Little Caesars", "Denny's", "New York Fries", "Manchu Wok",
  "Starbucks", "Tim Hortons", "Dunkin", "Second Cup", "Country Style", "Coffee Time",
  "Chipotle", "Panera", "Freshii", "Osmow's", "Quesada",
  "Fat Bastard Burrito", "Extreme Pita", "Pita Pit", "Mr. Sub", "Cultures",
  "Booster Juice", "Jamba Juice", "Chatime", "Gong Cha", "CoCo",
  "The Alley", "Tiger Sugar", "Kung Fu Tea", "Quickly",
];

const CHAIN_PATTERNS = CHAIN_BLOCKLIST.map((c) => c.toLowerCase());

// ─── Non-restaurant type blocklist ───

const SKIP_TYPES = [
  "gas_station", "convenience_store", "grocery_store", "pharmacy",
  "bank", "car_wash", "laundry", "hardware_store", "clothing_store",
  "shopping_mall", "department_store", "supermarket", "butcher_shop",
];

// ─── Price level mapping ───

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

// ─── Type extraction ───

const TYPE_PRIORITY = [
  "cafe", "coffee_shop", "restaurant", "bar", "bakery",
  "breakfast_restaurant", "brunch_restaurant", "steak_house",
  "fine_dining_restaurant", "seafood_restaurant", "italian_restaurant",
  "french_restaurant", "japanese_restaurant", "sushi_restaurant",
  "mexican_restaurant", "thai_restaurant", "korean_restaurant",
  "indian_restaurant", "greek_restaurant", "vietnamese_restaurant",
  "mediterranean_restaurant", "middle_eastern_restaurant",
  "american_restaurant", "chinese_restaurant", "pizza_restaurant",
  "hamburger_restaurant", "ice_cream_shop", "dessert_shop",
  "tea_house", "juice_shop", "pub", "night_club",
];

function extractPlaceType(types: string[]): string {
  // Try priority types first
  for (const pt of TYPE_PRIORITY) {
    if (types.includes(pt)) {
      return pt.replace(/_/g, " ");
    }
  }
  // Fallback: first type that looks food-related
  const foodish = types.find(
    (t) =>
      t.includes("restaurant") ||
      t.includes("cafe") ||
      t.includes("bar") ||
      t.includes("bakery") ||
      t.includes("food")
  );
  if (foodish) return foodish.replace(/_/g, " ");
  return types[0]?.replace(/_/g, " ") ?? "restaurant";
}

// ─── Auto-tagging (from auto-tag-places.ts + romantic/chill from retag script) ───

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
    if (studyTypes.some((t) => type.includes(t))) tags.add("study");
    if (/\b(library|study|work|cowork|books)\b/i.test(nameLower)) tags.add("study");
  }

  // ─── romantic ───
  const romanticTypes = [
    "restaurant", "steakhouse", "steak house", "bistro",
    "french restaurant", "italian restaurant", "japanese restaurant",
    "sushi restaurant", "cocktail bar", "wine bar", "lounge",
    "fine dining", "seafood restaurant", "mediterranean restaurant",
    "spanish restaurant", "tapas", "mexican restaurant",
    "thai restaurant", "korean restaurant", "indian restaurant",
    "greek restaurant", "middle eastern restaurant",
    "persian restaurant", "vietnamese restaurant", "brazilian restaurant",
  ];
  const antiRomanticTypes = ["cafe", "coffee shop", "bakery", "fast", "bbq", "burger", "pub", "hookah", "pizza"];
  const romanticNameKw = /\b(bistro|wine|cocktail|tapas|fine|elegant|steakhouse)\b/i;
  const antiRomanticName = /\b(100%\s*veg|pure\s*veg|express|fast|quick)\b/i;

  let isRomantic = false;
  if (!antiRomanticTypes.some((t) => type.includes(t)) && !antiRomanticName.test(place.name)) {
    if (romanticNameKw.test(nameLower)) {
      isRomantic = true;
    } else {
      const isRomanticType = romanticTypes.some((t) => type.includes(t));
      const hasGoodRating = place.rating !== null && place.rating >= 4.2;
      const hasRightPrice = price === null || price >= 2;
      isRomantic = isRomanticType && hasGoodRating && hasRightPrice;
    }
  }

  // ─── chill ───
  const chillTypes = [
    "cafe", "coffee shop", "bakery", "dessert", "brunch",
    "breakfast restaurant", "tea house", "tea room", "juice bar",
    "ice cream", "bubble tea", "pub", "bar",
  ];
  const antiChillTypes = ["steakhouse", "steak house", "fine dining"];
  const chillNameKw = /\b(chill|cozy|garden|brunch|hangout|vibes)\b/i;

  let isChill = false;
  if (!antiChillTypes.some((t) => type.includes(t)) && price !== 4) {
    if (chillTypes.some((t) => type.includes(t)) || chillNameKw.test(place.name)) {
      isChill = true;
    }
  }

  // ─── Tiebreaker for romantic/chill ───
  if (isRomantic && isChill) {
    if (price !== null && price >= 3) { isChill = false; }
    else if (price === 1) { isRomantic = false; }
    else {
      const isCafeType = ["cafe", "coffee shop", "bakery"].some((t) => type.includes(t));
      if (isCafeType) { isRomantic = false; }
      else { isChill = false; }
    }
  }

  if (isRomantic) tags.add("romantic");
  if (isChill) tags.add("chill");

  // ─── trending ───
  if (rating >= 4.5) tags.add("trending");

  // ─── quiet ───
  const quietTypes = ["cafe", "coffee shop", "bakery", "tea house", "tea room"];
  const antiQuietTypes = ["bar", "pub", "hookah", "grill"];
  const antiQuietName = /\b(sports|grill)\b/i.test(nameLower);
  const isAntiQuiet = antiQuietTypes.some((t) => type.includes(t)) || antiQuietName;
  if (!isAntiQuiet && quietTypes.some((t) => type.includes(t))) tags.add("quiet");

  // ─── groups ───
  const groupTypes = ["restaurant", "pub", "bar", "hookah", "pizza", "burger", "korean bbq", "bbq", "grill"];
  const groupNameKw = /\b(grill|sports|pub|bar|patio|garden|bbq|pizza|wings)\b/i;
  const isGroupPrice = price !== null && price <= 2;
  if (groupTypes.some((t) => type.includes(t)) || groupNameKw.test(nameLower)) {
    if (isGroupPrice || price === null) tags.add("groups");
  }

  // ─── budget ───
  const budgetTypes = [
    "fast", "shawarma", "falafel", "ramen", "noodle", "dumpling",
    "taco", "burrito", "pizza", "pho", "banh mi", "deli", "bakery",
  ];
  const budgetName = /\b(cheap|deal|special|combo|express|quick)\b/i;
  if (price === 1) tags.add("budget");
  else if (budgetTypes.some((t) => type.includes(t))) tags.add("budget");
  else if (budgetName.test(nameLower)) tags.add("budget");

  // ─── coffee ───
  const coffeeTypes = ["cafe", "coffee shop", "bakery", "dessert", "ice cream"];
  const coffeeName = /\b(coffee|espresso|brew|roast|latte|cafe|café|bakery|pastry|donut|doughnut)\b/i;
  if (coffeeTypes.some((t) => type.includes(t)) || coffeeName.test(nameLower)) tags.add("coffee");

  // ─── outdoor ───
  if (/\b(patio|garden|terrace|rooftop|outdoor|park)\b/i.test(nameLower)) tags.add("outdoor");

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
    }
  }

  return [...tags];
}

// ─── Google Places Text Search ───

interface GooglePlace {
  id: string;
  displayName: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  priceLevel?: string;
  types?: string[];
  photos?: { name: string }[];
}

async function searchPlaces(query: string, lat: number, lng: number): Promise<GooglePlace[]> {
  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 5000,
      },
    },
  };

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.places ?? [];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ───

async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  SEED GTA PLACES`);
  console.log(`${"=".repeat(60)}\n`);

  // Load existing place IDs for deduplication
  const existing = await prisma.place.findMany({ select: { googlePlaceId: true } });
  const existingIds = new Set(existing.map((p) => p.googlePlaceId));
  console.log(`Existing places in DB: ${existingIds.size}`);
  console.log(`Areas to search: ${AREAS.length}`);
  console.log(`Queries per area: ${QUERY_TEMPLATES.length}`);
  console.log(`Total API calls: ~${AREAS.length * QUERY_TEMPLATES.length}\n`);

  let totalNew = 0;
  let totalDuplicates = 0;
  let totalChains = 0;
  let totalBadType = 0;
  let totalApiErrors = 0;
  const areaStats: { name: string; added: number }[] = [];
  const newTagCounts = new Map<string, number>();
  // Track all google place IDs seen in this run for cross-area dedup
  const seenThisRun = new Set<string>();

  for (let areaIdx = 0; areaIdx < AREAS.length; areaIdx++) {
    const area = AREAS[areaIdx];
    let areaNew = 0;
    let areaDups = 0;
    let areaChains = 0;
    let areaBadType = 0;

    for (const template of QUERY_TEMPLATES) {
      const query = template.replace("{area}", area.name);

      let places: GooglePlace[];
      try {
        places = await searchPlaces(query, area.lat, area.lng);
      } catch (err) {
        console.log(`  ERROR [${area.name}] "${query}": ${err}`);
        totalApiErrors++;
        await sleep(200);
        continue;
      }

      for (const gp of places) {
        const googlePlaceId = gp.id;

        // Dedup: already in DB or already seen this run
        if (existingIds.has(googlePlaceId) || seenThisRun.has(googlePlaceId)) {
          areaDups++;
          continue;
        }
        seenThisRun.add(googlePlaceId);

        const name = gp.displayName?.text ?? "";

        // Chain check
        const nameLower = name.toLowerCase();
        if (CHAIN_PATTERNS.some((c) => nameLower.includes(c))) {
          areaChains++;
          continue;
        }

        // Type check
        const types = gp.types ?? [];
        if (types.some((t) => SKIP_TYPES.includes(t))) {
          areaBadType++;
          continue;
        }

        const placeType = extractPlaceType(types);
        const priceLevel = gp.priceLevel ? (PRICE_MAP[gp.priceLevel] ?? null) : null;
        const rating = gp.rating ?? null;

        // Photo URL: prefer index 1, fallback to 0
        let photoUrl: string | null = null;
        if (gp.photos && gp.photos.length > 0) {
          const photoIdx = gp.photos.length > 1 ? 1 : 0;
          const photoName = gp.photos[photoIdx].name;
          photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${API_KEY}`;
        }

        // Auto-tag
        const vibeTags = assignTags({ name, placeType, rating, priceLevel });

        // Save to DB
        try {
          await prisma.place.create({
            data: {
              googlePlaceId,
              name,
              lat: gp.location?.latitude ?? area.lat,
              lng: gp.location?.longitude ?? area.lng,
              address: gp.formattedAddress ?? "",
              placeType,
              priceLevel,
              rating,
              photoUrl,
              vibeTags,
            },
          });
          existingIds.add(googlePlaceId);
          areaNew++;

          // Track tags
          for (const t of vibeTags) {
            newTagCounts.set(t, (newTagCounts.get(t) || 0) + 1);
          }
        } catch (err) {
          // Unique constraint violation = duplicate, skip
          const msg = String(err);
          if (msg.includes("Unique constraint")) {
            areaDups++;
          } else {
            console.log(`  DB ERROR: ${name}: ${msg.slice(0, 100)}`);
          }
        }
      }

      await sleep(200);
    }

    totalNew += areaNew;
    totalDuplicates += areaDups;
    totalChains += areaChains;
    totalBadType += areaBadType;
    areaStats.push({ name: area.name, added: areaNew });

    console.log(
      `  [${areaIdx + 1}/${AREAS.length}] ${area.name.padEnd(35)} +${areaNew} new (${areaDups} dups, ${areaChains} chains, ${areaBadType} bad type)`
    );
  }

  // ─── Summary ───
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`  Total new places added:         ${totalNew}`);
  console.log(`  Total duplicates skipped:        ${totalDuplicates}`);
  console.log(`  Total chains skipped:            ${totalChains}`);
  console.log(`  Total non-restaurant skipped:    ${totalBadType}`);
  console.log(`  Total API errors:                ${totalApiErrors}`);
  console.log(`  Total places in DB now:          ${existingIds.size}\n`);

  // Tag distribution for new places
  console.log(`--- New places tag distribution ---\n`);
  const sorted = [...newTagCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [tag, count] of sorted) {
    const bar = "#".repeat(Math.min(Math.round(count / 3), 60));
    console.log(`  ${tag.padEnd(12)} ${String(count).padStart(4)}  ${bar}`);
  }

  // Breakdown by region
  console.log(`\n--- New places by area ---\n`);
  const withPlaces = areaStats.filter((a) => a.added > 0);
  for (const a of withPlaces) {
    console.log(`  ${a.name.padEnd(35)} +${a.added}`);
  }
  const emptyAreas = areaStats.filter((a) => a.added === 0);
  if (emptyAreas.length > 0) {
    console.log(`\n  Areas with 0 new places: ${emptyAreas.length}`);
  }

  console.log();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
