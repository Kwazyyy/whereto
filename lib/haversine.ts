/**
 * Haversine formula — returns distance in meters between two lat/lng points.
 * Used both server-side (API GPS verification) and client-side (proximity checks).
 */
export function haversineMeters(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6_371_000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
