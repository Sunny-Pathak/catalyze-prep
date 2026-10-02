"use client";

import React, { useState } from "react";
import { DualScramble } from "./DualScramble";

export function KineticHeadline() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative z-20 flex flex-col items-center justify-center select-none text-center">
      {/* Monumental Headline with Luminous Metallic Violet Shimmer */}
      <h1
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative cursor-pointer text-6xl sm:text-8xl md:text-9xl lg:text-[11.5rem] font-black tracking-[-0.04em] font-[family-name:var(--font-syne)] leading-[0.88] uppercase transition-all duration-700 hover:tracking-[-0.02em]"
      >
        {/* Base text */}
        <span
          className={`block text-white transition-all duration-500 drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)] ${
            isHovered
              ? "drop-shadow-[0_0_40px_rgba(192,132,252,0.8)] text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-white"
              : ""
          }`}
        >
          DISCIPLINE
        </span>
      </h1>

      {/* Clean, free-floating elegant italic statement */}
      <div className="mt-3 sm:mt-5 text-3xl sm:text-5xl md:text-6xl font-serif italic text-violet-300 drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
        <DualScramble
          text="is Real."
          chars="01[]/<>!#*+~"
          speed={30}
          scrambleOnMount={false}
          className="cursor-pointer transition-colors duration-300 hover:text-white"
        />
      </div>
    </div>
  );
}
