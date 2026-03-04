export const PHOTO_CATEGORIES = [
    { id: "food_drink", label: "Food & Drink", prompt: "What did you order?", icon: "🍽️" },
    { id: "vibe_interior", label: "Vibe & Interior", prompt: "Show the ambiance", icon: "✨" },
    { id: "seating_workspace", label: "Seating & Workspace", prompt: "Where did you sit?", icon: "💺" },
    { id: "exterior_entrance", label: "Exterior", prompt: "What does it look like from outside?", icon: "🏠" },
    { id: "special_features", label: "Something Special", prompt: "Anything unique?", icon: "⭐" },
] as const;

export type PhotoCategoryId = (typeof PHOTO_CATEGORIES)[number]["id"];

export const MAX_PHOTOS_PER_CATEGORY = 10;
export const CATEGORIES_PER_VISIT = 3;
export const PHOTO_AGE_LIMIT_DAYS = 90;
