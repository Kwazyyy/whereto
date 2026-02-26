import { prisma } from "@/lib/prisma";
import { BADGE_DEFINITIONS } from "./badges";
import { getNeighborhoodForPlace, torontoNeighborhoods } from "./neighborhoods";

export interface UserBadgeStats {
    visitedPlacesCount: number;
    neighborhoodsExploredCount: number;
    friendsCount: number;
    recommendationsSentCount: number;
    savesCount: number;
    allIntentsCount: number;
    currentStreak: number;
}

export async function getUserBadgeStats(userId: string): Promise<UserBadgeStats> {
    const visits = await prisma.visit.findMany({
        where: { userId },
        include: { place: true }
    });

    const uniqueVisitedPlaceIds = new Set(visits.map(v => v.placeId));
    const visitedPlacesCount = uniqueVisitedPlaceIds.size;

    const uniqueNeighborhoods = new Set<string>();
    visits.forEach(v => {
        if (v.place.lat != null && v.place.lng != null) {
            const hood = getNeighborhoodForPlace(v.place.lat, v.place.lng);
            if (hood) uniqueNeighborhoods.add(hood.name);
        }
    });
    const neighborhoodsExploredCount = uniqueNeighborhoods.size;

    const friendsCount = await prisma.friendship.count({
        where: {
            OR: [
                { senderId: userId, status: "accepted" },
                { receiverId: userId, status: "accepted" }
            ]
        }
    });

    const recommendationsSentCount = await prisma.recommendation.count({
        where: { senderId: userId }
    });

    const saves = await prisma.save.findMany({
        where: { userId },
        select: { intent: true, createdAt: true }
    });
    const savesCount = saves.length;
    const uniqueIntents = new Set(saves.map(s => s.intent));
    const allIntentsCount = uniqueIntents.size;

    const allActivityDates = new Set<string>();
    saves.forEach(s => {
        allActivityDates.add(s.createdAt.toISOString().split("T")[0]);
    });
    visits.forEach(v => {
        allActivityDates.add(v.createdAt.toISOString().split("T")[0]);
    });

    const sortedDates = Array.from(allActivityDates).sort((a, b) => b.localeCompare(a));

    let currentStreak = 0;
    if (sortedDates.length > 0) {
        let streak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const currentD = new Date(sortedDates[i]);
            const nextD = new Date(sortedDates[i + 1]);
            const diffTime = Math.abs(currentD.getTime() - nextD.getTime());
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }
        currentStreak = streak;
    }

    return {
        visitedPlacesCount,
        neighborhoodsExploredCount,
        friendsCount,
        recommendationsSentCount,
        savesCount,
        allIntentsCount,
        currentStreak
    };
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
    const newBadges: string[] = [];

    try {
        const earnedBadges = await prisma.badge.findMany({
            where: { userId },
            select: { badgeType: true }
        });
        const earnedBadgeTypes = new Set(earnedBadges.map(b => b.badgeType));

        const stats = await getUserBadgeStats(userId);
        const {
            visitedPlacesCount,
            neighborhoodsExploredCount,
            friendsCount,
            recommendationsSentCount,
            savesCount,
            allIntentsCount,
            currentStreak
        } = stats;

        // 3. Evaluate rules
        for (const def of BADGE_DEFINITIONS) {
            if (earnedBadgeTypes.has(def.type)) continue;

            let meetsRequirement = false;

            switch (def.type) {
                case "first_visit": meetsRequirement = visitedPlacesCount >= def.requirement; break;
                case "explorer_5": meetsRequirement = visitedPlacesCount >= def.requirement; break;
                case "explorer_10": meetsRequirement = visitedPlacesCount >= def.requirement; break;
                case "explorer_25": meetsRequirement = visitedPlacesCount >= def.requirement; break;
                case "explorer_50": meetsRequirement = visitedPlacesCount >= def.requirement; break;

                case "neighborhood_3": meetsRequirement = neighborhoodsExploredCount >= def.requirement; break;
                case "neighborhood_10": meetsRequirement = neighborhoodsExploredCount >= def.requirement; break;
                case "neighborhood_all": meetsRequirement = neighborhoodsExploredCount >= torontoNeighborhoods.length; break;

                case "first_friend": meetsRequirement = friendsCount >= def.requirement; break;
                case "friends_5": meetsRequirement = friendsCount >= def.requirement; break;

                case "first_rec": meetsRequirement = recommendationsSentCount >= def.requirement; break;
                case "rec_10": meetsRequirement = recommendationsSentCount >= def.requirement; break;

                case "first_save": meetsRequirement = savesCount >= def.requirement; break;
                case "saves_25": meetsRequirement = savesCount >= def.requirement; break;
                case "saves_50": meetsRequirement = savesCount >= def.requirement; break;

                case "all_intents": meetsRequirement = allIntentsCount >= def.requirement; break;

                case "streak_3": meetsRequirement = currentStreak >= def.requirement; break;
                case "streak_7": meetsRequirement = currentStreak >= def.requirement; break;
                case "streak_30": meetsRequirement = currentStreak >= def.requirement; break;
            }

            if (meetsRequirement) {
                await prisma.badge.create({
                    data: {
                        userId,
                        badgeType: def.type
                    }
                });
                newBadges.push(def.type);
                earnedBadgeTypes.add(def.type);
            }
        }
    } catch (e) {
        console.error("Error in checkAndAwardBadges validating criteria: ", e);
    }

    return newBadges;
}
