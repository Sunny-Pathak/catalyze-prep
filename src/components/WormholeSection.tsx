"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { LnVectorCutout } from "./LnVectorCutout";

const PILLARS = [
  {
    num: "01",
    roman: "I",
    title: "Quantitative Aptitude",
    desc: "Track 3,160 topic-wise questions across Arithmetic, Algebra, Geometry, and Modern Math with daily completion status.",
    metric: "3,160 Questions • Topic-Wise Checklist",
  },
  {
    num: "02",
    roman: "II",
    title: "Data Interpretation & LR",
    desc: "650 curated problem sets categorized by difficulty, set type, and solving time with comprehensive attempt tracking.",
    metric: "650 Sets • Pace & Time Tracking",
  },
  {
    num: "03",
    roman: "III",
    title: "Verbal & Reading Comprehension",
    desc: "620 RC passages across diverse genres with error categorization to isolate silly mistakes and comprehension gaps.",
    metric: "620 Passages • Error Notebook",
  },
  {
    num: "04",
    roman: "IV",
    title: "Daily Quotas & Study Plan",
    desc: "16-week structured schedule with daily streak tracking, mock test logs, and automated backlog recovery.",
    metric: "16 Weeks • 112 Active Days",
  },
];

export function WormholeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textBlockRef = useRef<HTMLDivElement>(null);
  const prevPillarRef = useRef(0);

  const [telemetry, setTelemetry] = useState({
    prog: 0,
    invert: 0,
  });

  // Track window scroll telemetry
  useEffect(() => {
    let ticking = false;
    let sectionTop = 0;
    let sectionHeight = 0;
    let windowH = 0;

    const measure = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      sectionTop = rect.top + window.scrollY;
      sectionHeight = rect.height;
      windowH = window.innerHeight;
    };

    measure();

    const update = () => {
      ticking = false;
      const totalScrollable = sectionHeight - windowH;
      if (totalScrollable <= 0) return;

      const scrollY = window.scrollY;
      const rectTop = sectionTop - scrollY;
      const scrolled = -rectTop;
      const prog = Math.min(1, Math.max(0, scrolled / totalScrollable));

      // Color Invert Factor (0.0 = dark obsidian, 1.0 = soothing cashmere light)
      let invertFactor = 0;
      if (prog > 0.04) {
        const invT = Math.min(1, Math.max(0, (prog - 0.04) / 0.18));
        invertFactor = invT * invT * (3 - 2 * invT);
      }

      setTelemetry({
        prog,
        invert: 0,
      });

      if (typeof window !== "undefined") {
        (window as any).__stoicWormhole = {
          isActive: rectTop <= 0 && rectTop + sectionHeight >= windowH,
          progress: prog,
          shake: 0,
          invert: 0,
        };
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", measure);
    update();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // The 4 Architectural Pillars are driven with generous, comfortable scroll runway across [0.14, 0.94]
  let activePillarIdx = 0;
  if (telemetry.prog >= 0.14) {
    const pProg = Math.min(0.999, Math.max(0, (telemetry.prog - 0.14) / 0.80));
    activePillarIdx = Math.min(3, Math.floor(pProg * 4));
  }
  const currentPillar = PILLARS[activePillarIdx];

  // GSAP Smooth Text Transition whenever the active pillar index changes
  useEffect(() => {
    if (prevPillarRef.current === activePillarIdx) return;
    prevPillarRef.current = activePillarIdx;

    if (textBlockRef.current) {
      gsap.fromTo(
        textBlockRef.current,
        { opacity: 0.1, y: 16, filter: "blur(4px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power3.out" }
      );
    }
  }, [activePillarIdx]);

  // Click handler to smooth-scroll directly to any pillar
  const handleJumpToPillar = (idx: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const targetProg = 0.14 + (idx + 0.5) * (0.80 / 4);
    const totalScrollable = section.clientHeight - window.innerHeight;
    const targetY = section.offsetTop + targetProg * totalScrollable;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  // Left card opacity fades in smoothly right as angel arrives (prog 0.10 to 0.14)
  const cardOpacity = Math.min(1, Math.max(0, (telemetry.prog - 0.10) / 0.04));

  return (
    <section
      ref={sectionRef}
      id="wormhole"
      className="relative w-full h-[480vh] bg-transparent select-none"
    >
      {/* Sticky Fullscreen Layer */}
      <div className="sticky top-0 h-screen w-full pointer-events-none z-20">
        {/* PURE MINIMALIST ARCHITECTURAL SHOWCASE (Left Wing, driven by scroll wheel) */}
        {cardOpacity > 0.01 && (
          <div
            style={{ opacity: cardOpacity }}
            className="fixed bottom-5 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 left-3 right-3 sm:right-auto sm:left-14 lg:left-20 w-[calc(100vw-1.5rem)] sm:w-[420px] pointer-events-auto z-30 transition-opacity duration-300"
          >
            {/* Fixed-Size Elegant Obsidian Glassmorphism Card */}
            <div className="w-full h-[410px] sm:h-[430px] bg-[#090710]/95 sm:bg-[#0b0914]/90 backdrop-blur-2xl border border-white/[0.08] p-5 sm:p-6 pb-4 sm:pb-5 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.95)] flex flex-col justify-between overflow-hidden select-none">
              {/* 1. fogleman/ln 3D Vector Wireframe Cutout */}
              <div className="w-full flex items-center justify-start h-[130px] sm:h-[135px]">
                <LnVectorCutout
                  pillarIndex={activePillarIdx}
                  invertFactor={0}
                  scrollDelta={telemetry.prog * 22}
                />
              </div>

              {/* 2. Headline & Simple Uncluttered Text */}
              <div ref={textBlockRef} className="flex flex-col gap-1.5 sm:gap-2 my-auto">
                <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-violet-400 font-bold uppercase">
                  <span>PHASE {currentPillar.roman}</span>
                  <span className="text-white/20">/</span>
                  <span className="text-white/40">IV</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-serif tracking-tight font-normal leading-tight text-white">
                  {currentPillar.title}
                </h2>

                <p className="font-sans text-xs sm:text-[13px] leading-relaxed text-slate-300">
                  {currentPillar.desc}
                </p>

                <div className="mt-0.5 font-mono text-[9.5px] sm:text-[11px] text-violet-400/90 font-medium tracking-[0.1em] uppercase">
                  {currentPillar.metric}
                </div>
              </div>

              {/* 3. Clean Roman Numerals Navigation */}
              <div className="flex items-center gap-4 sm:gap-6 pt-3 pb-1 border-t border-white/[0.08]">
                {PILLARS.map((p, idx) => {
                  const isActive = activePillarIdx === idx;
                  return (
                    <button
                      key={p.num}
                      onClick={() => handleJumpToPillar(idx)}
                      className={`font-mono text-xs sm:text-sm tracking-widest transition-colors duration-200 cursor-pointer relative py-1 px-1.5 ${
                        isActive
                          ? "text-white font-bold"
                          : "text-slate-500 hover:text-white"
                      }`}
                      title={`Phase ${p.roman}`}
                    >
                      [ {p.roman} ]
                      {isActive && (
                        <span
                          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
