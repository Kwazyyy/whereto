export type VibeCategory = "Atmosphere" | "Good For" | "Food & Drink" | "Practical";

export interface VibeTagDef {
    label: string;
    emoji: string;
    category: VibeCategory;
}

export const VIBE_CATEGORIES: VibeCategory[] = ["Atmosphere", "Good For", "Food & Drink", "Practical"];

export const VIBE_TAGS: VibeTagDef[] = [
    // ATMOSPHERE
    { label: "Cozy", emoji: "🛋️", category: "Atmosphere" },
    { label: "Trendy", emoji: "✨", category: "Atmosphere" },
    { label: "Chill", emoji: "😌", category: "Atmosphere" },
    { label: "Lively", emoji: "🎉", category: "Atmosphere" },
    { label: "Romantic", emoji: "🍷", category: "Atmosphere" },
    { label: "Minimalist", emoji: "🤍", category: "Atmosphere" },
    { label: "Rustic", emoji: "🪵", category: "Atmosphere" },
    { label: "Artsy", emoji: "🎨", category: "Atmosphere" },

    // GOOD FOR
    { label: "Studying", emoji: "📚", category: "Good For" },
    { label: "Date Night", emoji: "💌", category: "Good For" },
    { label: "Group Hangout", emoji: "🍻", category: "Good For" },
    { label: "Solo Visit", emoji: "🎧", category: "Good For" },
    { label: "Working Remote", emoji: "💻", category: "Good For" },
    { label: "Catching Up", emoji: "💬", category: "Good For" },
    { label: "People Watching", emoji: "👀", category: "Good For" },
    { label: "Reading", emoji: "📖", category: "Good For" },

    // FOOD & DRINK
    { label: "Great Coffee", emoji: "☕", category: "Food & Drink" },
    { label: "Amazing Pastries", emoji: "🥐", category: "Food & Drink" },
    { label: "Healthy Options", emoji: "🥗", category: "Food & Drink" },
    { label: "Brunch Spot", emoji: "🥞", category: "Food & Drink" },
    { label: "Late-Night Eats", emoji: "🌙", category: "Food & Drink" },
    { label: "Cocktail Bar", emoji: "🍸", category: "Food & Drink" },
    { label: "Budget-Friendly", emoji: "💸", category: "Food & Drink" },
    { label: "Splurge-Worthy", emoji: "💎", category: "Food & Drink" },

    // PRACTICAL
    { label: "Fast WiFi", emoji: "📶", category: "Practical" },
    { label: "Lots of Outlets", emoji: "🔌", category: "Practical" },
    { label: "Quiet", emoji: "🤫", category: "Practical" },
    { label: "Loud/Energetic", emoji: "🔊", category: "Practical" },
    { label: "Good for Photos", emoji: "📸", category: "Practical" },
    { label: "Pet-Friendly", emoji: "🐕", category: "Practical" },
    { label: "Spacious", emoji: "🏛️", category: "Practical" },
    { label: "Hidden Gem", emoji: "🗝️", category: "Practical" },
];

export function getVibeByLabel(label: string): VibeTagDef | undefined {
    return VIBE_TAGS.find((t) => t.label === label);
}
