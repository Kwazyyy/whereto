export interface SavedPlace {
  saveId?: string;
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  price: string;
  rating: number;
  photoRef: string | null;
  type: string;
  openNow: boolean;
  hours: string[];
  distance: string;
  tags: string[];
  intent: string;
  savedAt: number;
  // Recommendation metadata (present when intent === 'recs_from_friends')
  recommenderNote?: string | null;
  recommendedByName?: string | null;
  recommendedByImage?: string | null;
  recommendedAt?: string | null;
}

const STORAGE_KEY = "whereto_saved_places";

export function getSavedPlaces(): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePlace(place: Omit<SavedPlace, "savedAt">) {
  const existing = getSavedPlaces();
  if (existing.some((p) => p.placeId === place.placeId)) return;
  const updated = [{ ...place, savedAt: Date.now() }, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removePlace(placeId: string) {
  const existing = getSavedPlaces();
  const updated = existing.filter((p) => p.placeId !== placeId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function isPlaceSaved(placeId: string): boolean {
  return getSavedPlaces().some((p) => p.placeId === placeId);
}
