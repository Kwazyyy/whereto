"use client";

import { useState } from "react";

const categories = [
  { id: "study", emoji: "\u{1F4DA}", label: "Study / Work" },
  { id: "date", emoji: "\u{2764}\u{FE0F}", label: "Date / Chill" },
  { id: "trending", emoji: "\u{1F525}", label: "Trending Now" },
  { id: "quiet", emoji: "\u{1F92B}", label: "Quiet Cafés" },
  { id: "laptop", emoji: "\u{1F50C}", label: "Laptop-Friendly" },
  { id: "group", emoji: "\u{1F46F}", label: "Group Hangouts" },
  { id: "budget", emoji: "\u{1F354}", label: "Budget Eats" },
  { id: "coffee", emoji: "\u{2615}", label: "Coffee & Catch-Up" },
  { id: "outdoor", emoji: "\u{1F305}", label: "Outdoor / Patio" },
];

export default function Home() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="pt-14 pb-8 px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: "#E85D2A" }}>
          WhereTo
        </h1>
        <p className="mt-2 text-lg font-medium" style={{ color: "#1B2A4A" }}>
          Where to today?
        </p>
      </header>

      {/* Category Grid */}
      <main className="flex-1 px-5 pb-40">
        <div className="grid grid-cols-2 gap-3.5 max-w-md mx-auto">
          {categories.map((cat, index) => {
            const isSelected = selected === cat.id;
            const isDimmed = selected !== null && !isSelected;
            const isLastOdd =
              index === categories.length - 1 && categories.length % 2 === 1;

            return (
              <button
                key={cat.id}
                onClick={() => setSelected(isSelected ? null : cat.id)}
                className={`
                  flex flex-col items-center justify-center gap-2.5
                  rounded-2xl border-2 py-7 px-4
                  shadow-sm
                  transition-all duration-300 ease-in-out cursor-pointer
                  ${isLastOdd ? "col-span-2" : ""}
                  ${
                    isSelected
                      ? "border-[#E85D2A] bg-[#E85D2A]/10 scale-[1.03] shadow-md shadow-[#E85D2A]/20"
                      : isDimmed
                        ? "border-gray-100 bg-gray-50/80 opacity-45 shadow-none"
                        : "border-gray-200 bg-white hover:border-[#E85D2A]/40 hover:shadow-md"
                  }
                `}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span
                  className={`text-sm font-semibold transition-colors duration-300 ${
                    isSelected ? "text-[#E85D2A]" : "text-[#1B2A4A]"
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      {/* Find Places Button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-10 pt-6 bg-gradient-to-t from-white from-60% to-transparent">
        <button
          disabled={!selected}
          className={`
            w-full max-w-md mx-auto block
            py-4 rounded-2xl text-lg font-bold
            transition-all duration-200
            ${
              selected
                ? "bg-[#E85D2A] text-white shadow-lg shadow-[#E85D2A]/30 hover:bg-[#d04e1f] active:scale-[0.98] cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          Find Places
        </button>
      </div>
    </div>
  );
}
