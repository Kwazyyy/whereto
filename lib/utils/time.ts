export function relativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) return "Just now";

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;

    if (diffDays === 1) return "Yesterday";

    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }

    // E.g. "Feb 28"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
