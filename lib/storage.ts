export const SKIPPED_KEY = "whereto_skipped";

export function loadSkippedForIntent(intentId: string): Set<string> {
    try {
        const raw = localStorage.getItem(SKIPPED_KEY);
        if (!raw) return new Set();
        const all = JSON.parse(raw) as Record<string, string[]>;
        return new Set(all[intentId] ?? []);
    } catch {
        return new Set();
    }
}

export function persistSkippedForIntent(intentId: string, ids: Set<string>) {
    try {
        const raw = localStorage.getItem(SKIPPED_KEY);
        const all = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
        all[intentId] = [...ids];
        localStorage.setItem(SKIPPED_KEY, JSON.stringify(all));
    } catch {
        // ignore
    }
}

export function clearSkippedForIntent(intentId: string) {
    try {
        const raw = localStorage.getItem(SKIPPED_KEY);
        if (!raw) return;
        const all = JSON.parse(raw) as Record<string, string[]>;
        delete all[intentId];
        localStorage.setItem(SKIPPED_KEY, JSON.stringify(all));
    } catch {
        // ignore
    }
}
