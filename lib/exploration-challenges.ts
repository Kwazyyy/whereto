/**
 * Exploration challenge helpers — determines how many places
 * a user must visit to unlock each neighborhood.
 */

/** Scaled unlock requirement based on how many places exist in a neighborhood */
export function getRequiredVisits(totalPlaces: number): number {
  if (totalPlaces < 5) return 1;
  if (totalPlaces <= 10) return 2;
  if (totalPlaces <= 20) return 3;
  if (totalPlaces <= 35) return 5;
  return 7;
}

/** Derive a neighborhood's exploration status */
export function getNeighborhoodStatus(
  visitedCount: number,
  requiredVisits: number,
  totalPlacesInArea: number,
): "undiscovered" | "in_progress" | "unlocked" | "no_data" {
  if (totalPlacesInArea === 0) return "no_data";
  if (visitedCount === 0) return "undiscovered";
  if (visitedCount >= requiredVisits) return "unlocked";
  return "in_progress";
}

/** Turn a neighborhood name into a URL-safe slug */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
