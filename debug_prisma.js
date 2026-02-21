const { PrismaClient } = require('./lib/generated/prisma');

async function debug() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No users found");
            return;
        }
        const saves = await prisma.save.findMany({
            where: { userId: user.id },
            include: { place: true },
            orderBy: { createdAt: "desc" },
        });
        console.log("Found saves:", saves.length);

        const result = saves.map((s) => {
            try {
                return {
                    saveId: s.id,
                    placeId: s.place.googlePlaceId,
                    name: s.place.name,
                    address: s.place.address,
                    location: { lat: s.place.lat, lng: s.place.lng },
                    rating: s.place.rating ?? 0,
                    photoRef: s.place.photoUrl,
                    type: s.place.placeType,
                    intent: s.intent,
                };
            } catch (e) {
                console.error("Mapping failed for save:", s.id, e);
                return null;
            }
        });

        console.log("Successfully mapped:", result.filter(Boolean).length);
    } catch (err) {
        console.error("Prisma error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
