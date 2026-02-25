export interface Neighborhood {
    name: string;
    area: string;
    center: { lat: number; lng: number };
    radius: number; // in meters
}

export const torontoNeighborhoods: Neighborhood[] = [
    // Downtown
    { name: "Financial District", area: "Downtown", center: { lat: 43.6480, lng: -79.3816 }, radius: 700 },
    { name: "Harbourfront", area: "Downtown", center: { lat: 43.6383, lng: -79.3855 }, radius: 1000 },
    { name: "St. Lawrence Market", area: "Downtown", center: { lat: 43.6487, lng: -79.3715 }, radius: 600 },
    { name: "King West", area: "Downtown", center: { lat: 43.6441, lng: -79.3996 }, radius: 700 },
    { name: "Distillery District", area: "Downtown", center: { lat: 43.6503, lng: -79.3596 }, radius: 500 },

    // West End
    { name: "Liberty Village", area: "West End", center: { lat: 43.6380, lng: -79.4187 }, radius: 700 },
    { name: "Parkdale", area: "West End", center: { lat: 43.6402, lng: -79.4357 }, radius: 800 },
    { name: "Roncesvalles", area: "West End", center: { lat: 43.6455, lng: -79.4501 }, radius: 800 },
    { name: "Junction", area: "West End", center: { lat: 43.6655, lng: -79.4655 }, radius: 700 },
    { name: "High Park", area: "West End", center: { lat: 43.6465, lng: -79.4637 }, radius: 1000 },
    { name: "Queen West", area: "West End", center: { lat: 43.6476, lng: -79.3970 }, radius: 700 },
    { name: "Ossington", area: "West End", center: { lat: 43.6457, lng: -79.4195 }, radius: 500 },
    { name: "Dundas West", area: "West End", center: { lat: 43.6498, lng: -79.4215 }, radius: 800 },
    { name: "Trinity Bellwoods", area: "West End", center: { lat: 43.6465, lng: -79.4137 }, radius: 600 },
    { name: "Little Italy", area: "West End", center: { lat: 43.6552, lng: -79.4143 }, radius: 600 },
    { name: "Bloor West Village", area: "West End", center: { lat: 43.6496, lng: -79.4842 }, radius: 800 },

    // East End
    { name: "Leslieville", area: "East End", center: { lat: 43.6625, lng: -79.3315 }, radius: 800 },
    { name: "The Beaches", area: "East End", center: { lat: 43.6710, lng: -79.2967 }, radius: 1000 },
    { name: "Greektown", area: "East End", center: { lat: 43.6780, lng: -79.3486 }, radius: 700 },
    { name: "Danforth", area: "East End", center: { lat: 43.6792, lng: -79.3444 }, radius: 900 },
    { name: "Cabbagetown", area: "East End", center: { lat: 43.6657, lng: -79.3644 }, radius: 700 },
    { name: "Riverdale", area: "East End", center: { lat: 43.6698, lng: -79.3508 }, radius: 800 },

    // Midtown
    { name: "Yorkville", area: "Midtown", center: { lat: 43.6704, lng: -79.3910 }, radius: 600 },
    { name: "The Annex", area: "Midtown", center: { lat: 43.6698, lng: -79.4075 }, radius: 800 },
    { name: "Summerhill", area: "Midtown", center: { lat: 43.6823, lng: -79.3897 }, radius: 600 },
    { name: "Midtown", area: "Midtown", center: { lat: 43.7058, lng: -79.3983 }, radius: 1200 },
    { name: "College Street", area: "Midtown", center: { lat: 43.6558, lng: -79.4128 }, radius: 800 },
    { name: "Koreatown", area: "Midtown", center: { lat: 43.6644, lng: -79.4173 }, radius: 600 },
    { name: "Chinatown", area: "Midtown", center: { lat: 43.6529, lng: -79.3980 }, radius: 600 },
    { name: "Kensington Market", area: "Midtown", center: { lat: 43.6548, lng: -79.4007 }, radius: 600 },

    // North York
    { name: "North York Centre", area: "North York", center: { lat: 43.7673, lng: -79.4121 }, radius: 1000 },
    { name: "Yonge & Sheppard", area: "North York", center: { lat: 43.7615, lng: -79.4111 }, radius: 600 },
    { name: "Yonge & Finch", area: "North York", center: { lat: 43.7801, lng: -79.4148 }, radius: 600 },
    { name: "Bayview Village", area: "North York", center: { lat: 43.7688, lng: -79.3878 }, radius: 600 },
    { name: "Don Mills", area: "North York", center: { lat: 43.7445, lng: -79.3460 }, radius: 700 },

    // Scarborough
    { name: "Scarborough Town Centre", area: "Scarborough", center: { lat: 43.7764, lng: -79.2578 }, radius: 700 },
    { name: "Agincourt", area: "Scarborough", center: { lat: 43.7940, lng: -79.2810 }, radius: 700 },
    { name: "Birch Cliff", area: "Scarborough", center: { lat: 43.6920, lng: -79.2640 }, radius: 600 },

    // Etobicoke
    { name: "Islington Village", area: "Etobicoke", center: { lat: 43.6490, lng: -79.5240 }, radius: 600 },
    { name: "The Kingsway", area: "Etobicoke", center: { lat: 43.6530, lng: -79.5070 }, radius: 600 },
    { name: "Mimico", area: "Etobicoke", center: { lat: 43.6150, lng: -79.4940 }, radius: 600 },
    { name: "Long Branch", area: "Etobicoke", center: { lat: 43.5930, lng: -79.5410 }, radius: 600 },
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
