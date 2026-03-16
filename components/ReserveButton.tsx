"use client";

import { CalendarCheck } from "lucide-react";
import { getBookingUrl, isReservable } from "@/lib/booking";

interface ReserveButtonProps {
  placeName: string;
  address: string;
  googlePlaceId: string;
  placeType?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline";
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

const iconSizes = { sm: 14, md: 16, lg: 18 } as const;

export default function ReserveButton({
  placeName,
  address,
  googlePlaceId,
  placeType,
  size = "md",
  variant = "primary",
}: ReserveButtonProps) {
  if (!isReservable(placeType)) return null;

  const { url, platform } = getBookingUrl(placeName, address, googlePlaceId);

  const base = "inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors cursor-pointer";
  const variantStyle =
    variant === "primary"
      ? "bg-[#E85D2A] hover:bg-[#d14e1f] text-white"
      : "border border-[#E85D2A] text-[#E85D2A] hover:bg-[#E85D2A]/10";

  const handleClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    fetch("/api/bookings/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googlePlaceId, platform }),
    }).catch(() => {});
  };

  return (
    <button onClick={handleClick} className={`${base} ${variantStyle} ${sizeStyles[size]}`}>
      <CalendarCheck size={iconSizes[size]} />
      {size === "sm" ? "Reserve" : "Reserve a Table"}
    </button>
  );
}
