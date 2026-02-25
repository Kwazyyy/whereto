export interface Neighborhood {
    name: string;
    center: { lat: number; lng: number };
    radius: number; // in meters
}

export const torontoNeighborhoods: Neighborhood[] = [
    { name: "Kensington Market", center: { lat: 43.6548, lng: -79.4007 }, radius: 600 },
    { name: "The Annex", center: { lat: 43.6698, lng: -79.4075 }, radius: 800 },
    { name: "Yorkville", center: { lat: 43.6704, lng: -79.3910 }, radius: 600 },
    { name: "Liberty Village", center: { lat: 43.6380, lng: -79.4187 }, radius: 700 },
    { name: "Queen West", center: { lat: 43.6476, lng: -79.3970 }, radius: 700 },
    { name: "Ossington", center: { lat: 43.6457, lng: -79.4195 }, radius: 500 },
    { name: "Leslieville", center: { lat: 43.6625, lng: -79.3315 }, radius: 800 },
    { name: "The Beaches", center: { lat: 43.6710, lng: -79.2967 }, radius: 1000 },
    { name: "Distillery District", center: { lat: 43.6503, lng: -79.3596 }, radius: 500 },
    { name: "St. Lawrence Market", center: { lat: 43.6487, lng: -79.3715 }, radius: 600 },
    { name: "King West", center: { lat: 43.6441, lng: -79.3996 }, radius: 700 },
    { name: "College Street", center: { lat: 43.6558, lng: -79.4128 }, radius: 800 },
    { name: "Bloor West Village", center: { lat: 43.6496, lng: -79.4842 }, radius: 800 },
    { name: "Roncesvalles", center: { lat: 43.6455, lng: -79.4501 }, radius: 800 },
    { name: "Parkdale", center: { lat: 43.6402, lng: -79.4357 }, radius: 800 },
    { name: "Junction", center: { lat: 43.6655, lng: -79.4655 }, radius: 700 },
    { name: "High Park", center: { lat: 43.6465, lng: -79.4637 }, radius: 1000 },
    { name: "Danforth", center: { lat: 43.6792, lng: -79.3444 }, radius: 900 },
    { name: "Greektown", center: { lat: 43.6780, lng: -79.3486 }, radius: 700 },
    { name: "Chinatown", center: { lat: 43.6529, lng: -79.3980 }, radius: 600 },
    { name: "Little Italy", center: { lat: 43.6552, lng: -79.4143 }, radius: 600 },
    { name: "Koreatown", center: { lat: 43.6644, lng: -79.4173 }, radius: 600 },
    { name: "Harbourfront", center: { lat: 43.6383, lng: -79.3855 }, radius: 1000 },
    { name: "Financial District", center: { lat: 43.6480, lng: -79.3816 }, radius: 700 },
    { name: "Cabbagetown", center: { lat: 43.6657, lng: -79.3644 }, radius: 700 },
    { name: "Riverdale", center: { lat: 43.6698, lng: -79.3508 }, radius: 800 },
    { name: "Trinity Bellwoods", center: { lat: 43.6465, lng: -79.4137 }, radius: 600 },
    { name: "Dundas West", center: { lat: 43.6498, lng: -79.4215 }, radius: 800 },
    { name: "Summerhill", center: { lat: 43.6823, lng: -79.3897 }, radius: 600 },
    { name: "Midtown", center: { lat: 43.7058, lng: -79.3983 }, radius: 1200 },
    { name: "North York Centre", center: { lat: 43.7673, lng: -79.4121 }, radius: 1000 },
];

/**
 * Calculates the Haversine distance between two points in meters.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Finds the corresponding neighborhood for a given coordinate.
 * Returns the first neighborhood where the coordinate falls within its radius.
 */
export function getNeighborhoodForPlace(lat: number, lng: number): Neighborhood | null {
    for (const hood of torontoNeighborhoods) {
        const dist = haversineDistance(lat, lng, hood.center.lat, hood.center.lng);
        if (dist <= hood.radius) {
            return hood;
        }
    }
    return null;
}
