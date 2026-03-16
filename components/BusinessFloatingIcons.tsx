"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Store, Coffee, Utensils, PieChart, Users, MapPin } from "lucide-react";

export default function BusinessFloatingIcons() {
  return (
    <>
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#E85D2A]/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-[#E85D2A]/8 rounded-full blur-[120px]" />

      {/* Floating business + food icons layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* 1. BarChart3 — top-left */}
        <motion.div
          className="absolute top-[6%] left-[5%] opacity-30 pointer-events-none"
          style={{ rotate: 10 }}
          animate={{ y: [0, -12, 0], rotate: [10, 14, 10] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-44 h-44 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <BarChart3 color="#E85D2A" size={110} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 2. Store — top-right */}
        <motion.div
          className="absolute top-[6%] right-[6%] opacity-30 pointer-events-none"
          style={{ rotate: -12 }}
          animate={{ y: [0, -12, 0], rotate: [-12, -8, -12] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-40 h-40 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Store color="#E85D2A" size={105} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 3. Coffee — top-center-left, hidden on mobile */}
        <motion.div
          className="absolute top-[3%] left-[28%] opacity-30 pointer-events-none hidden md:block"
          style={{ rotate: -8 }}
          animate={{ y: [0, -12, 0], rotate: [-8, -4, -8] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-36 h-36 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Coffee color="#E85D2A" size={90} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 4. PieChart — upper-right, large desktop only */}
        <motion.div
          className="absolute top-[18%] right-[18%] opacity-30 pointer-events-none hidden lg:block"
          style={{ rotate: 15 }}
          animate={{ y: [0, -12, 0], rotate: [15, 19, 15] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-6 w-32 h-32 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <PieChart color="#E85D2A" size={80} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 5. Utensils — mid-left, hidden on mobile */}
        <motion.div
          className="absolute top-[50%] left-[2%] opacity-30 pointer-events-none hidden md:block"
          style={{ rotate: 20 }}
          animate={{ y: [0, -12, 0], rotate: [20, 24, 20] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-40 h-40 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Utensils color="#E85D2A" size={100} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 6. TrendingUp — mid-right, hidden on mobile */}
        <motion.div
          className="absolute top-[45%] right-[3%] opacity-30 pointer-events-none hidden md:block"
          style={{ rotate: -6 }}
          animate={{ y: [0, -12, 0], rotate: [-6, -2, -6] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-40 h-40 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <TrendingUp color="#E85D2A" size={105} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 7. Users — bottom-left */}
        <motion.div
          className="absolute bottom-[12%] left-[8%] opacity-30 pointer-events-none"
          style={{ rotate: 8 }}
          animate={{ y: [0, -12, 0], rotate: [8, 12, 8] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-40 h-40 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <Users color="#E85D2A" size={100} strokeWidth={1.5} className="relative" />
        </motion.div>

        {/* 8. MapPin — bottom-right */}
        <motion.div
          className="absolute bottom-[10%] right-[7%] opacity-30 pointer-events-none"
          style={{ rotate: -20 }}
          animate={{ y: [0, -12, 0], rotate: [-20, -16, -20] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute -inset-8 w-36 h-36 bg-[#E85D2A]/20 rounded-full blur-[50px]" />
          <MapPin color="#E85D2A" size={95} strokeWidth={1.5} className="relative" />
        </motion.div>
      </div>
    </>
  );
}
