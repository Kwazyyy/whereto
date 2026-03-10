import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

const CHAIN_BLOCKLIST = [
  // Fast Food
  "McDonald's", "Burger King", "Wendy's", "Subway", "Pizza Pizza",
  "Popeyes", "KFC", "Taco Bell", "A&W", "Harvey's", "Five Guys",
  "Chick-fil-A", "Dairy Queen", "IHOP", "Waffle House", "Papa John's",
  "Domino's", "Little Caesars", "Denny's", "New York Fries", "Manchu Wok",
  // Generic Coffee / Donut Chains
  "Starbucks", "Tim Hortons", "Dunkin", "Second Cup", "Country Style", "Coffee Time",
  // Fast Casual Chains
  "Chipotle", "Panera", "Freshii", "Osmow's", "Quesada",
  "Fat Bastard Burrito", "Extreme Pita", "Pita Pit", "Mr. Sub", "Cultures",
  // Juice / Bubble Tea Chains
  "Booster Juice", "Jamba Juice", "Chatime", "Gong Cha", "CoCo",
  "The Alley", "Tiger Sugar", "Kung Fu Tea", "Quickly",
];

async function main() {
  const places = await prisma.place.findMany({
    select: { id: true, name: true, address: true },
  });

  console.log(`\n=== CHAIN AUDIT REPORT ===\n`);
  console.log(`Total places in database: ${places.length}\n`);

  const matches: { id: string; name: string; address: string; matchedChain: string }[] = [];

  for (const place of places) {
    const nameLower = place.name.toLowerCase();
    for (const chain of CHAIN_BLOCKLIST) {
      if (nameLower.includes(chain.toLowerCase())) {
        matches.push({ ...place, matchedChain: chain });
        break;
      }
    }
  }

  console.log(`Chain matches found: ${matches.length}\n`);

  if (matches.length > 0) {
    console.log("ID | Name | Address | Matched Chain");
    console.log("-".repeat(100));
    for (const m of matches) {
      console.log(`${m.id} | ${m.name} | ${m.address} | ${m.matchedChain}`);
    }
  } else {
    console.log("No chain matches found.");
  }

  console.log("");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
