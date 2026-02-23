import { haversineMeters } from "./haversine";

const PENDING_KEY = "whereto_pending_visit";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const PROXIMITY_M = 200;

export interface PendingVisit {
    placeId: string;
    name: string;
    lat: number;
    lng: number;
    photoRef: string | null;
    storedAt: number; // Date.now()
}

/** Store a pending visit when user taps Go Now */
export function setPendingVisit(place: {
    placeId: string;
    name: string;
    location: { lat: number; lng: number };
    photoRef: string | null;
}) {
    const pending: PendingVisit = {
        placeId: place.placeId,
        name: place.name,
        lat: place.location.lat,
        lng: place.location.lng,
        photoRef: place.photoRef,
        storedAt: Date.now(),
    };
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

/** Clear the pending visit */
export function clearPendingVisit() {
    localStorage.removeItem(PENDING_KEY);
}

/** Get the pending visit (or null if expired/missing) */
export function getPendingVisit(): PendingVisit | null {
    try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return null;
        const pending: PendingVisit = JSON.parse(raw);
        if (Date.now() - pending.storedAt > MAX_AGE_MS) {
            clearPendingVisit();
            return null;
        }
        return pending;
    } catch {
        return null;
    }
}

/**
 * Check if the user is near their pending visit place.
 * Returns the pending visit if within 200m, or null.
 * Uses the browser Geolocation API.
 */
export function checkPendingVisitProximity(): Promise<PendingVisit | null> {
    return new Promise((resolve) => {
        const pending = getPendingVisit();
        if (!pending) return resolve(null);

        if (!navigator.geolocation) return resolve(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const dist = haversineMeters(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    pending.lat,
                    pending.lng
                );
                if (dist <= PROXIMITY_M) {
                    resolve(pending);
                } else {
                    resolve(null);
                }
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
        );
    });
}

/**
 * Verify a visit via the API (called after proximity confirmed).
 * Returns { visitId, name, verifiedAt } on success, or null on failure.
 */
export async function verifyVisitOnServer(
    placeId: string,
    lat: number,
    lng: number,
    method: "go_now" | "manual"
): Promise<{ visitId: string; name: string; verifiedAt: string } | null> {
    try {
        const res = await fetch("/api/visits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ placeId, lat, lng, method }),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
