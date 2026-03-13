"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import VibeVotingSheet from "../VibeVotingSheet";
import NudgeBottomSheet from "../nudges/NudgeBottomSheet";
import { shouldShowNudge, markNudgeSeen, NUDGE_FIRST_VISIT_PHOTO } from "@/lib/nudges";

interface VibeVotingContextType {
    triggerVibeVoting: (placeId: string, placeName: string) => void;
}

const VibeVotingContext = createContext<VibeVotingContextType | undefined>(undefined);

export function VibeVotingProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [currentPlace, setCurrentPlace] = useState<{ id: string, name: string } | null>(null);
    const [photoNudgePlace, setPhotoNudgePlace] = useState<{ id: string; name: string } | null>(null);

    const triggerVibeVoting = useCallback((placeId: string, placeName: string) => {
        setCurrentPlace({ id: placeId, name: placeName });
        setIsOpen(true);
    }, []);

    const handleClose = () => {
        const place = currentPlace;
        setIsOpen(false);
        // Delay clearing the current place so the sheet can animate out cleanly
        setTimeout(() => setCurrentPlace(null), 500);

        // After vibe voting closes, show photo nudge if it's the user's first visit
        if (place && shouldShowNudge(NUDGE_FIRST_VISIT_PHOTO)) {
            setTimeout(() => {
                setPhotoNudgePlace(place);
            }, 800);
        }
    };

    return (
        <VibeVotingContext.Provider value={{ triggerVibeVoting }}>
            {children}
            {currentPlace && (
                <VibeVotingSheet
                    isOpen={isOpen}
                    placeId={currentPlace.id}
                    placeName={currentPlace.name}
                    onClose={handleClose}
                />
            )}
            <NudgeBottomSheet
                isOpen={!!photoNudgePlace}
                onClose={() => {
                    markNudgeSeen(NUDGE_FIRST_VISIT_PHOTO);
                    setPhotoNudgePlace(null);
                }}
                icon={Camera}
                title="Snap a photo?"
                description={`Share what you saw at ${photoNudgePlace?.name ?? "this spot"}! Your photos help others discover great places.`}
                ctaText="Upload Photo"
                onCta={() => {
                    markNudgeSeen(NUDGE_FIRST_VISIT_PHOTO);
                    const id = photoNudgePlace?.id;
                    setPhotoNudgePlace(null);
                    if (id) router.push(`/places/${id}/photos`);
                }}
                secondaryText="Maybe later"
            />
        </VibeVotingContext.Provider>
    );
}

export function useVibeVoting() {
    const context = useContext(VibeVotingContext);
    if (!context) {
        throw new Error("useVibeVoting must be used within VibeVotingProvider");
    }
    return context;
}
