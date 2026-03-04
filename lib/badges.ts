export type BadgeCategory = "exploration" | "social" | "streak" | "collector" | "photos";

export interface BadgeDefinition {
    type: string;
    name: string;
    description: string;
    icon: string;
    category: BadgeCategory;
    requirement: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    // EXPLORATION
    { type: "first_visit", name: "First Steps", description: "Verify your first visit", icon: "🚶", category: "exploration", requirement: 1 },
    { type: "explorer_5", name: "Urban Explorer", description: "Visit 5 different places", icon: "🧭", category: "exploration", requirement: 5 },
    { type: "explorer_10", name: "City Wanderer", description: "Visit 10 different places", icon: "🗺️", category: "exploration", requirement: 10 },
    { type: "explorer_25", name: "Toronto Pro", description: "Visit 25 different places", icon: "⭐", category: "exploration", requirement: 25 },
    { type: "explorer_50", name: "Legend", description: "Visit 50 different places", icon: "👑", category: "exploration", requirement: 50 },
    { type: "neighborhood_3", name: "Neighborhood Hopper", description: "Explore 3 different neighborhoods", icon: "🏘️", category: "exploration", requirement: 3 },
    { type: "neighborhood_10", name: "District Master", description: "Explore 10 different neighborhoods", icon: "🌆", category: "exploration", requirement: 10 },
    { type: "neighborhood_all", name: "Toronto Completionist", description: "Explore all neighborhoods", icon: "🏆", category: "exploration", requirement: 42 },

    // SOCIAL
    { type: "first_friend", name: "Social Butterfly", description: "Add your first friend", icon: "🦋", category: "social", requirement: 1 },
    { type: "friends_5", name: "Squad Goals", description: "Have 5 friends", icon: "👥", category: "social", requirement: 5 },
    { type: "first_rec", name: "Taste Sharer", description: "Send your first recommendation", icon: "💌", category: "social", requirement: 1 },
    { type: "rec_10", name: "Local Guide", description: "Send 10 recommendations", icon: "📣", category: "social", requirement: 10 },

    // COLLECTOR
    { type: "first_save", name: "Bookmarked", description: "Save your first place", icon: "🔖", category: "collector", requirement: 1 },
    { type: "saves_10", name: "Local Collector", description: "Save 10 places", icon: "📋", category: "collector", requirement: 10 },
    { type: "saves_25", name: "Curator", description: "Save 25 places", icon: "📚", category: "collector", requirement: 25 },
    { type: "saves_50", name: "Connoisseur", description: "Save 50 places", icon: "🎯", category: "collector", requirement: 50 },
    { type: "all_intents", name: "Well Rounded", description: "Save a place from every intent category", icon: "🎨", category: "collector", requirement: 9 },

    // STREAK
    { type: "streak_3", name: "Getting Hooked", description: "Use WhereTo 3 days in a row", icon: "🔥", category: "streak", requirement: 3 },
    { type: "streak_7", name: "Weekly Regular", description: "Use WhereTo 7 days in a row", icon: "⚡", category: "streak", requirement: 7 },
    { type: "streak_30", name: "Devoted Explorer", description: "Use WhereTo 30 days in a row", icon: "💎", category: "streak", requirement: 30 },

    // PHOTOS
    { type: "first_snap", name: "First Snap", description: "Upload your first photo", icon: "📸", category: "photos", requirement: 1 },
    { type: "shutterbug", name: "Shutterbug", description: "Get 10 photos approved", icon: "📷", category: "photos", requirement: 10 },
    { type: "full_picture", name: "Full Picture", description: "Upload all 5 categories for one place", icon: "🎨", category: "photos", requirement: 5 },
    { type: "crowd_favorite", name: "Crowd Favorite", description: "Get 10 likes on a single photo", icon: "❤️", category: "photos", requirement: 10 },
    { type: "featured_contributor", name: "Featured Contributor", description: "Have 5+ photos featured in galleries", icon: "🌟", category: "photos", requirement: 5 },
];
