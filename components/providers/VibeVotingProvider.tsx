"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import VibeVotingSheet from "../VibeVotingSheet";

interface VibeVotingContextType {
    triggerVibeVoting: (placeId: string, placeName: string) => void;
}

const VibeVotingContext = createContext<VibeVotingContextType | undefined>(undefined);

export function VibeVotingProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPlace, setCurrentPlace] = useState<{ id: string, name: string } | null>(null);

    const triggerVibeVoting = useCallback((placeId: string, placeName: string) => {
        setCurrentPlace({ id: placeId, name: placeName });
        setIsOpen(true);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Delay clearing the current place so the sheet can animate out cleanly
        setTimeout(() => setCurrentPlace(null), 500);
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
