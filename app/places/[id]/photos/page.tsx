import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PhotoGallery from "./PhotoGallery";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const place = await prisma.place.findUnique({
        where: { id },
        select: { name: true },
    });

    if (!place) return { title: "Photos — WhereTo" };

    return {
        title: `${place.name} — Community Photos | WhereTo`,
        description: `Community photos of ${place.name} on WhereTo`,
    };
}

export default async function PlacePhotosPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const place = await prisma.place.findUnique({
        where: { id },
        select: { id: true, name: true, googlePlaceId: true },
    });

    if (!place) notFound();

    return <PhotoGallery placeId={place.id} placeName={place.name} />;
}
