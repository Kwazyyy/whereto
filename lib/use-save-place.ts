"use client";

import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { Place } from "@/lib/types";
import { useBadges } from "@/components/providers/BadgeProvider";

const INTENT_LABELS: Record<string, string> = {
  study_work: "Study / Work",
  date_chill: "Date / Chill",
  trending: "Trending Now",
  quiet_cafes: "Quiet Cafes",
  laptop_friendly: "Laptop-Friendly",
  group_hangouts: "Group Hangouts",
  budget_eats: "Budget Eats",
  desserts: "Desserts",
  coffee_catch_up: "Coffee & Catch-Up",
  outdoor_patio: "Outdoor / Patio",
};

export function useSavePlace() {
  const { status } = useSession();
  const { showToast } = useToast();
  const { triggerBadgeCheck } = useBadges();

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

    // Check for badges asynchronously
    triggerBadgeCheck();
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
