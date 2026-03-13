import type { LucideIcon } from "lucide-react";
import {
    Flame, Sparkles, CloudSun, Music, Heart, Minus, TreePine, Palette,
    BookOpen, Users, User, Laptop, MessageCircle, Eye,
    Coffee, Croissant, Leaf, UtensilsCrossed, Moon, Wine, DollarSign, Gem,
    Wifi, Plug, VolumeX, Volume2, Camera, PawPrint, Maximize, MapPin,
} from "lucide-react";

export type VibeCategory = "Atmosphere" | "Good For" | "Food & Drink" | "Practical";

export interface VibeTagDef {
    label: string;
    iconName: string;
    category: VibeCategory;
}

export const VIBE_CATEGORIES: VibeCategory[] = ["Atmosphere", "Good For", "Food & Drink", "Practical"];

export const VIBE_TAGS: VibeTagDef[] = [
    // ATMOSPHERE
    { label: "Cozy", iconName: "Flame", category: "Atmosphere" },
    { label: "Trendy", iconName: "Sparkles", category: "Atmosphere" },
    { label: "Chill", iconName: "CloudSun", category: "Atmosphere" },
    { label: "Lively", iconName: "Music", category: "Atmosphere" },
    { label: "Romantic", iconName: "Heart", category: "Atmosphere" },
    { label: "Minimalist", iconName: "Minus", category: "Atmosphere" },
    { label: "Rustic", iconName: "TreePine", category: "Atmosphere" },
    { label: "Artsy", iconName: "Palette", category: "Atmosphere" },

    // GOOD FOR
    { label: "Studying", iconName: "BookOpen", category: "Good For" },
    { label: "Date Night", iconName: "Heart", category: "Good For" },
    { label: "Group Hangout", iconName: "Users", category: "Good For" },
    { label: "Solo Visit", iconName: "User", category: "Good For" },
    { label: "Working Remote", iconName: "Laptop", category: "Good For" },
    { label: "Catching Up", iconName: "MessageCircle", category: "Good For" },
    { label: "People Watching", iconName: "Eye", category: "Good For" },
    { label: "Reading", iconName: "BookOpen", category: "Good For" },

    // FOOD & DRINK
    { label: "Great Coffee", iconName: "Coffee", category: "Food & Drink" },
    { label: "Amazing Pastries", iconName: "Croissant", category: "Food & Drink" },
    { label: "Healthy Options", iconName: "Leaf", category: "Food & Drink" },
    { label: "Brunch Spot", iconName: "UtensilsCrossed", category: "Food & Drink" },
    { label: "Late-Night Eats", iconName: "Moon", category: "Food & Drink" },
    { label: "Cocktail Bar", iconName: "Wine", category: "Food & Drink" },
    { label: "Budget-Friendly", iconName: "DollarSign", category: "Food & Drink" },
    { label: "Splurge-Worthy", iconName: "Gem", category: "Food & Drink" },

    // PRACTICAL
    { label: "Fast WiFi", iconName: "Wifi", category: "Practical" },
    { label: "Lots of Outlets", iconName: "Plug", category: "Practical" },
    { label: "Quiet", iconName: "VolumeX", category: "Practical" },
    { label: "Loud/Energetic", iconName: "Volume2", category: "Practical" },
    { label: "Good for Photos", iconName: "Camera", category: "Practical" },
    { label: "Pet-Friendly", iconName: "PawPrint", category: "Practical" },
    { label: "Spacious", iconName: "Maximize", category: "Practical" },
    { label: "Hidden Gem", iconName: "MapPin", category: "Practical" },
];

/** Map icon name strings to Lucide components (client-side only) */
export const VIBE_ICON_MAP: Record<string, LucideIcon> = {
    Flame, Sparkles, CloudSun, Music, Heart, Minus, TreePine, Palette,
    BookOpen, Users, User, Laptop, MessageCircle, Eye,
    Coffee, Croissant, Leaf, UtensilsCrossed, Moon, Wine, DollarSign, Gem,
    Wifi, Plug, VolumeX, Volume2, Camera, PawPrint, Maximize, MapPin,
};

/** Get the Lucide component for a vibe tag icon name */
export function getVibeIcon(iconName: string): LucideIcon | undefined {
    return VIBE_ICON_MAP[iconName];
}

export function getVibeByLabel(label: string): VibeTagDef | undefined {
    return VIBE_TAGS.find((t) => t.label === label);
}
