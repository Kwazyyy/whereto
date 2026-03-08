// Pro feature gating utility
// Kill switch: when false, all users get unlimited access
export const PRO_GATES_ENABLED = false;

interface Limits {
  maxSaves: number;
  maxFriends: number;
  maxPhotosPerVisit: number;
  canPublishLists: boolean;
  canUseAdvancedFilters: boolean;
  hasPriorityInNewCities: boolean;
  hasProBadge: boolean;
}

export const FREE_LIMITS: Limits = {
  maxSaves: 50,
  maxFriends: 10,
  maxPhotosPerVisit: 3,
  canPublishLists: false,
  canUseAdvancedFilters: false,
  hasPriorityInNewCities: false,
  hasProBadge: false,
};

export const PRO_LIMITS: Limits = {
  maxSaves: Infinity,
  maxFriends: Infinity,
  maxPhotosPerVisit: 10,
  canPublishLists: true,
  canUseAdvancedFilters: true,
  hasPriorityInNewCities: true,
  hasProBadge: true,
};

export function getUserLimits(
  subscriptionStatus: string | null,
  plan: string | null
): Limits {
  if (!PRO_GATES_ENABLED) return PRO_LIMITS;
  if (isProUser(subscriptionStatus, plan)) return PRO_LIMITS;
  return FREE_LIMITS;
}

export function isProUser(
  subscriptionStatus: string | null,
  plan: string | null
): boolean {
  if (!PRO_GATES_ENABLED) return true;
  return subscriptionStatus === "active" && !!plan?.startsWith("pro");
}

const ACTION_CONFIG: Record<string, { limitKey: keyof Limits; label: string }> = {
  save: { limitKey: "maxSaves", label: "saves" },
  friend: { limitKey: "maxFriends", label: "friends" },
  photo: { limitKey: "maxPhotosPerVisit", label: "photos per visit" },
};

export function canPerformAction(
  action: string,
  currentCount: number,
  subscriptionStatus: string | null,
  plan: string | null
): { allowed: boolean; limit: number; upgradeMessage: string } {
  const limits = getUserLimits(subscriptionStatus, plan);
  const config = ACTION_CONFIG[action];

  if (!config) {
    return { allowed: true, limit: Infinity, upgradeMessage: "" };
  }

  const limit = limits[config.limitKey] as number;

  if (currentCount < limit) {
    return { allowed: true, limit, upgradeMessage: "" };
  }

  return {
    allowed: false,
    limit,
    upgradeMessage: `You've reached your free limit of ${limit} ${config.label}. Upgrade to Savrd Pro for unlimited ${config.label}!`,
  };
}
