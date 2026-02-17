export interface Place {
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
}
