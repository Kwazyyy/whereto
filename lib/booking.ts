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
