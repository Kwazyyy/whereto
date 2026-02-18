"use client";

import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { savePlace } from "@/lib/saved-places";
import { Place } from "@/lib/types";

const INTENT_LABELS: Record<string, string> = {
  study: "Study / Work",
  date: "Date / Chill",
  trending: "Trending Now",
  quiet: "Quiet Cafes",
  laptop: "Laptop-Friendly",
  group: "Group Hangouts",
  budget: "Budget Eats",
  coffee: "Coffee & Catch-Up",
  outdoor: "Outdoor / Patio",
};

export function useSavePlace() {
  const { status } = useSession();
  const { showToast } = useToast();

  async function handleSave(
    place: Place,
    intent: string,
    action: "save" | "go_now"
  ): Promise<void> {
    if (status === "authenticated") {
      const res = await fetch("/api/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place, intent, action }),
      });
      if (!res.ok) {
        showToast("Failed to save");
        return;
      }
    } else {
      savePlace({ ...place, intent });
    }

    const label = INTENT_LABELS[intent] ?? intent;
    showToast(action === "go_now" ? `Saved to ${label}` : `Saved to ${label}`);
  }

  return { handleSave };
}
