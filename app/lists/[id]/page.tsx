import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PublicListView from "./PublicListView";

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    const list = await prisma.curatedList.findUnique({
        where: { id },
        include: {
            creator: { select: { name: true } },
            items: {
                orderBy: { position: "asc" },
                take: 1,
                include: { place: { select: { photoUrl: true } } },
            },
            _count: { select: { items: true } },
        },
    });

    if (!list || !list.isPublic) {
        return { title: "List not found | WhereTo" };
    }

    const description =
        list.description || `${list._count.items} places curated by ${list.creator.name}`;

    // Resolve OG image from first place's photo reference
    let ogImage: string | undefined;
    const photoRef = list.items[0]?.place?.photoUrl;
    if (photoRef) {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (apiKey) {
            try {
                const url = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${apiKey}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.photoUri) ogImage = data.photoUri;
                }
            } catch {
                // Silently fail — OG image is optional
            }
        }
    }

    return {
        title: `${list.title} | WhereTo`,
        description,
        openGraph: {
            title: list.title,
            description,
            type: "website",
            ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
        },
        twitter: {
            card: ogImage ? "summary_large_image" : "summary",
            title: list.title,
            description,
            ...(ogImage ? { images: [ogImage] } : {}),
        },
    };
}

export default async function PublicListPage({ params }: Props) {
    const { id } = await params;
    return <PublicListView id={id} />;
}
