export type BookingPlatform = "opentable" | "resy" | "google";

export interface BookingLink {
  url: string;
  platform: BookingPlatform;
}

function extractCity(address: string): string {
  const parts = address.split(",").map((s) => s.trim());
  // Second-to-last part is typically the city (e.g. "123 King St W, Toronto, ON M5V 1J2")
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0];
}

export function getBookingUrl(
  placeName: string,
  address: string,
  _googlePlaceId: string
): BookingLink {
  const city = extractCity(address);

  // For now, default to Google search fallback for a guaranteed working link.
  // OpenTable and Resy URLs are constructed but not auto-selected until we
  // add server-side detection of which platform a restaurant is actually on.
  const _opentableUrl = `https://www.opentable.com/s?term=${encodeURIComponent(placeName + " " + city)}&covers=2&dateTime=${encodeURIComponent(new Date().toISOString())}`;
  const _resyUrl = `https://resy.com/cities/tor?query=${encodeURIComponent(placeName)}`;
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(placeName + " " + address + " reservations")}`;

  return { url: googleUrl, platform: "google" };
}

// Explicit show list — sit-down dining & bars where reservations make sense
const RESERVABLE_TYPES = new Set([
  "restaurant", "italian_restaurant", "indian_restaurant", "chinese_restaurant",
  "japanese_restaurant", "korean_restaurant", "thai_restaurant", "mexican_restaurant",
  "vietnamese_restaurant", "french_restaurant", "greek_restaurant",
  "mediterranean_restaurant", "middle_eastern_restaurant", "turkish_restaurant",
  "lebanese_restaurant", "american_restaurant", "seafood_restaurant",
  "steak_house", "steakhouse", "fine_dining", "fine_dining_restaurant",
  "bar", "lounge", "bar_and_grill", "gastropub",
  "brunch_restaurant", "sushi_restaurant", "brazilian_restaurant",
  "spanish_restaurant", "african_restaurant", "caribbean_restaurant",
  "persian_restaurant", "bbq", "barbecue_restaurant",
]);

// Explicit hide list — casual/counter-service spots
const NON_RESERVABLE_TYPES = new Set([
  "cafe", "coffee_shop", "bakery", "dessert_shop", "ice_cream_shop",
  "bubble_tea", "juice_bar", "donut_shop", "bagel_shop",
  "fast_food", "fast_food_restaurant", "pizza_delivery", "food_truck",
  "deli", "sandwich_shop", "food_court",
  "convenience_store", "grocery_store", "supermarket", "liquor_store",
]);

export function isReservable(placeType: string | null | undefined): boolean {
  if (!placeType) return false;
  const normalized = placeType.toLowerCase().trim();
  // Explicit hide list takes priority
  if (NON_RESERVABLE_TYPES.has(normalized)) return false;
  // Explicit show list
  if (RESERVABLE_TYPES.has(normalized)) return true;
  // Catch-all: any *_restaurant type (but not fast_food_restaurant, already caught above)
  if (normalized.includes("restaurant")) return true;
  // Default: hide on unknown types
  return false;
}

export function getBookingPlatformLabel(platform: string): string {
  switch (platform) {
    case "opentable":
      return "OpenTable";
    case "resy":
      return "Resy";
    default:
      return "Reserve";
  }
}
