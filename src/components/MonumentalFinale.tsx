"use client";

import React, { useState, useEffect } from "react";
import { MagneticButton } from "./MagneticButton";

export function MonumentalFinale() {
  const [istTime, setIstTime] = useState<string>("");
  const [daysLeft, setDaysLeft] = useState<number>(56);

  useEffect(() => {
    // Update live IST clock
    const updateClock = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setIstTime(formatter.format(now));

      // Calculate days to next CAT exam (last Sunday of November)
      const currentYear = now.getFullYear();
      let catDate = new Date(currentYear, 10, 29); // Late November
      if (now.getTime() > catDate.getTime()) {
        catDate = new Date(currentYear + 1, 10, 29);
      }
      const diffMs = catDate.getTime() - now.getTime();
      const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      setDaysLeft(diffDays);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="relative w-full min-h-screen bg-[#07060b] text-white flex flex-col justify-between p-8 sm:p-14 lg:p-20 z-20 select-none overflow-hidden">
      {/* Top Hairline Divider with Subtle Violet Ambient Glow */}
      <div className="w-full flex items-center justify-between pb-8 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-violet-400" />
          <span className="text-xs font-mono tracking-[0.25em] text-slate-400 uppercase">
            CATALYZE PROTOCOL
          </span>
        </div>

        <div className="text-xs font-mono tracking-widest text-slate-500 uppercase">
          {istTime ? `IST ${istTime} // NEW DELHI` : "NEW DELHI"}
        </div>
      </div>

      {/* Monumental Hero Resolution Stage */}
      <div className="my-auto py-20 flex flex-col items-center justify-center text-center">
        {/* Massive Screen-Filling Typography */}
        <h2 className="text-[13vw] font-black tracking-[-0.04em] font-[family-name:var(--font-syne)] leading-[0.85] uppercase text-white select-none transition-all duration-700 hover:tracking-[-0.02em]">
          <span className="block drop-shadow-[0_20px_60px_rgba(0,0,0,0.95)] hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-white hover:via-purple-200 hover:to-white">
            CATALYZE
          </span>
        </h2>

        {/* Quiet, Grounded Human Statement */}
        <p className="mt-8 max-w-lg text-base sm:text-xl font-serif italic text-slate-300 leading-relaxed px-4">
          Free, private, and built for people who study in silence.
        </p>

        {/* Single Confident Magnetic Action */}
        <div className="mt-10">
          <a
            href="https://cat-tracker-1538d.web.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block group"
          >
            <MagneticButton
              strength={0.35}
              className="px-8 sm:px-12 py-4 sm:py-5 bg-white/[0.04] hover:bg-violet-600/25 border border-white/[0.14] hover:border-violet-400/50 text-white font-mono text-xs sm:text-sm tracking-[0.24em] uppercase rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.7)] hover:shadow-[0_0_40px_rgba(168,85,247,0.35)] cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <span>OPEN APP</span>
                <span className="text-violet-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                  ↗
                </span>
              </span>
            </MagneticButton>
          </a>
        </div>
      </div>

      {/* Architectural Colophon Grid */}
      <div className="w-full pt-8 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-mono tracking-widest text-slate-500 uppercase">
        <div className="text-left">
          <span>{daysLeft} DAYS REMAINING TO CAT</span>
        </div>

        <div className="text-left sm:text-center">
          <a
            href="https://github.com/Sunny-Pathak/catalyze-prep"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors cursor-pointer group inline-flex items-center gap-1"
          >
            <span>CONCEPT & CODE BY SUNNY PATHAK</span>
            <span className="text-violet-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
              ↗
            </span>
          </a>
        </div>

        <div className="text-left sm:text-right">
          <span>CATALYZER © 2026</span>
        </div>
      </div>
    </footer>
  );
}
