const SKIPPED_KEY = "savrd-skipped-places";
const SKIP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Load all placeIds skipped within the last 24h, cleaning up expired entries. */
export function loadSkipped(): Set<string> {
  try {
    const raw = localStorage.getItem(SKIPPED_KEY);
    if (!raw) return new Set();
    const all = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    const valid: Record<string, number> = {};
    const result = new Set<string>();
    for (const [id, ts] of Object.entries(all)) {
      if (now - ts < SKIP_TTL_MS) {
        valid[id] = ts;
        result.add(id);
      }
    }
    // Write back with expired entries removed
    localStorage.setItem(SKIPPED_KEY, JSON.stringify(valid));
    return result;
  } catch {
    return new Set();
  }
}

/** Persist a skipped placeId with the current timestamp. */
export function persistSkipped(placeId: string) {
  try {
    const raw = localStorage.getItem(SKIPPED_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    all[placeId] = Date.now();
    localStorage.setItem(SKIPPED_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

/** Clear all skipped entries (used by the refresh/reset action). */
export function clearSkipped() {
  try {
    localStorage.removeItem(SKIPPED_KEY);
  } catch {
    // ignore
  }
}
