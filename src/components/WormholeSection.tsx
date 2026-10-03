"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { LnVectorCutout } from "./LnVectorCutout";

const PILLARS = [
  {
    num: "01",
    roman: "I",
    title: "QUANTITATIVE PURITY",
    quote: "Master the structure of numbers, and chaos dissolves.",
    metric: "3,160 PROBLEMS INDEXED · ARITHMETIC & ALGEBRA SYNTHESIS",
  },
  {
    num: "02",
    roman: "II",
    title: "DILR SELECTION ENGINE",
    quote: "The impediment to action advances action. What stands in the way becomes the way.",
    metric: "650 HIGH-DIFFICULTY SETS · SELECTION INTUITION ENGINE",
  },
  {
    num: "03",
    roman: "III",
    title: "DIALECTICAL VARC",
    quote: "The soul becomes dyed with the color of its thoughts. Read with detachment; infer with unyielding truth.",
    metric: "620 DIALECTICAL PASSAGES · INFERENCE TELEMETRY",
  },
  {
    num: "04",
    roman: "IV",
    title: "THE CONSISTENCY MATRIX",
    quote: "First say to yourself what you would be; and then do what you must without variance.",
    metric: "16 WEEKS DAILY EXECUTION · UNBROKEN STREAK PROTOCOL",
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

  // The 4 Architectural Pillars are driven seamlessly by the scroll wheel across [0.52, 1.00]
  let activePillarIdx = 0;
  if (telemetry.prog >= 0.52) {
    const pProg = Math.min(0.999, Math.max(0, (telemetry.prog - 0.52) / 0.48));
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
        { opacity: 0.15, y: 12, filter: "blur(3px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "power3.out" }
      );
    }
  }, [activePillarIdx]);

  // Click handler to smooth-scroll directly to any pillar
  const handleJumpToPillar = (idx: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const targetProg = 0.53 + (idx + 0.5) * (0.47 / 4);
    const totalScrollable = section.clientHeight - window.innerHeight;
    const targetY = section.offsetTop + targetProg * totalScrollable;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  // Left card opacity fades in smoothly between prog 0.48 and 0.54
  const cardOpacity = Math.min(1, Math.max(0, (telemetry.prog - 0.48) / 0.06));

  return (
    <section
      ref={sectionRef}
      id="wormhole"
      className="relative w-full h-[550vh] bg-transparent select-none"
    >
      {/* Sticky Fullscreen Layer */}
      <div className="sticky top-0 h-screen w-full pointer-events-none z-20">
        {/* PURE MINIMALIST ARCHITECTURAL SHOWCASE (Left Wing, driven by scroll wheel) */}
        {cardOpacity > 0.01 && (
          <div
            style={{ opacity: cardOpacity }}
            className="fixed bottom-5 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 left-3 right-3 sm:right-auto sm:left-14 lg:left-20 max-w-[calc(100vw-1.5rem)] sm:max-w-[440px] pointer-events-auto z-30 transition-opacity duration-300"
          >
            {/* Frosted Obsidian Glassmorphism Card */}
            <div className="bg-[#090710]/96 sm:bg-[#0b0914]/80 backdrop-blur-2xl border border-white/[0.12] sm:border-white/[0.08] p-4 sm:p-8 pb-5 sm:pb-8 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.95)] flex flex-col gap-2.5 sm:gap-6 max-h-[46vh] sm:max-h-[86vh] overflow-y-auto">
              {/* 1. fogleman/ln 3D Vector Wireframe Cutout */}
              <div className="w-full flex justify-start scale-[0.85] sm:scale-100 origin-left -my-3 sm:my-0">
                <LnVectorCutout
                  pillarIndex={activePillarIdx}
                  invertFactor={0}
                  scrollDelta={telemetry.prog * 18}
                />
              </div>

              {/* 2. Kinetic Headline & Quote */}
              <div ref={textBlockRef} className="flex flex-col gap-1 sm:gap-2">
                <h2 className="text-lg xs:text-xl sm:text-4xl font-serif tracking-tight font-normal leading-tight text-white">
                  {currentPillar.title}
                </h2>

                <p className="font-serif italic text-xs sm:text-base leading-relaxed text-violet-200/90">
                  &ldquo;{currentPillar.quote}&rdquo;
                </p>

                <div className="mt-0.5 sm:mt-1 font-mono text-[7.5px] xs:text-[8px] sm:text-[9.5px] tracking-[0.07em] xs:tracking-[0.11em] sm:tracking-[0.16em] uppercase text-violet-400/95 leading-tight truncate">
                  {currentPillar.metric}
                </div>
              </div>

              {/* 3. Clean Roman Numerals Navigation */}
              <div className="flex items-center gap-3 sm:gap-7 pt-1 sm:pt-2 pb-0.5">
                {PILLARS.map((p, idx) => {
                  const isActive = activePillarIdx === idx;
                  return (
                    <button
                      key={p.num}
                      onClick={() => handleJumpToPillar(idx)}
                      className={`font-mono text-xs sm:text-sm tracking-widest transition-all cursor-pointer relative py-1 ${
                        isActive
                          ? "text-white font-bold"
                          : "text-slate-500 hover:text-white"
                      }`}
                      title={`Pillar ${p.num}`}
                    >
                      [ {p.roman} ]
                      {isActive && (
                        <span
                          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)] animate-in fade-in zoom-in-50 duration-300"
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
