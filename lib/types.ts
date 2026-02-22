export interface FriendSignal {
  userId: string;
  name: string | null;
  image: string | null;
  tasteScore?: number; // 0–100, only present when score has been fetched
}

export interface Place {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  price: string;
  rating: number;
  photoRef: string | null;
  photoRefs?: string[];
  type: string;
  openNow: boolean;
  hours: string[];
  distance: string;
  tags: string[];
  friendSaves?: FriendSignal[];
  // Direct recommendation fields (set when this card is a friend recommendation)
  recommendationId?: string;
  recommendedBy?: { name: string | null; image: string | null };
  recommenderNote?: string | null;
}
