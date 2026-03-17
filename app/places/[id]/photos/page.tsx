import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PhotoGallery from "./PhotoGallery";

export function generateStaticParams() {
  return [];
}

async function findPlace(id: string) {
    // Try by internal UUID first, then by Google Place ID
    return (
        (await prisma.place.findUnique({
            where: { id },
            select: { id: true, name: true, googlePlaceId: true },
        })) ??
        (await prisma.place.findFirst({
            where: { googlePlaceId: id },
            select: { id: true, name: true, googlePlaceId: true },
        }))
    );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const place = await findPlace(id);

    if (!place) return { title: "Photos — Savrd" };

    return {
        title: `${place.name} — Community Photos | Savrd`,
        description: `Community photos of ${place.name} on Savrd`,
    };
}

export default async function PlacePhotosPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const place = await findPlace(id);

    if (!place) notFound();

    return <PhotoGallery placeId={place.id} placeName={place.name} />;
}
