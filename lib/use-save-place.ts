"use client";

import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
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
    action: "save" | "go_now",
    recommendationId?: string
  ): Promise<void> {
    if (status !== "authenticated") return;

    const res = await fetch("/api/saves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place, intent, action, recommendationId }),
    });
    if (!res.ok) {
      showToast("Failed to save");
      return;
    }

    const label = recommendationId ? "Recs from Friends" : (INTENT_LABELS[intent] ?? intent);
    showToast(`Saved to ${label}`);
  }

  async function handleUnsave(placeId: string): Promise<void> {
    if (status !== "authenticated") return;

    const res = await fetch("/api/saves", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId }),
    });
    if (!res.ok) {
      showToast("Failed to remove");
      return;
    }
    showToast("Removed from saved");
  }

  return { handleSave, handleUnsave };
}
