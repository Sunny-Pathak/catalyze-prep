"use client";

import React from "react";

export function Section3() {
  return (
    <section
      id="section-3"
      className="relative min-h-screen w-full flex flex-col justify-between p-8 sm:p-14 bg-transparent text-white select-none z-20 pointer-events-auto"
    >
      {/* Clean Subtle Phase Header */}
      <div className="flex items-center justify-between w-full border-b border-white/[0.06] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-violet-400 rotate-45" />
          <span className="text-xs font-mono tracking-[0.25em] text-violet-400 uppercase">
            PHASE III · BLANK CANVAS
          </span>
        </div>
        <div className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">
          03 / UNWRITTEN
        </div>
      </div>

      {/* Atmospheric Blank Canvas Stage with breathing space for Angel on the left */}
      <div className="my-auto flex flex-col items-center justify-center text-center py-32 lg:pl-[26%]">
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent mb-8" />
        <h3 className="text-3xl sm:text-4xl font-serif italic text-white/30 tracking-wider">
          Tabula Rasa
        </h3>
        <p className="mt-3 text-[11px] font-mono tracking-[0.25em] text-slate-600 uppercase">
          [ BLANK CANVAS STAGE ]
        </p>
      </div>

      {/* Footer Telemetry */}
      <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-widest text-slate-600 uppercase pt-6 border-t border-white/[0.04]">
        <span>CALIBRATED PROTOCOL</span>
        <span>AWAITING ARCHITECTURE</span>
      </div>
    </section>
  );
}
