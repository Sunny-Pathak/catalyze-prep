"use client";

import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

const CRITICAL_ASSETS = [
  "/assets/stoic_bust.jpg",
  "/assets/hero/hero_01.png",
  "/assets/stoic_pose3.jpg",
];

// Architectural ASCII glyph sequence transitioning from void to solid state
const GLYPH_STAGES = ["·", ":", "÷", "+", "×", "#", "■"];

export function LoadingScreen({
  onComplete,
  minDuration = 1200,
}: LoadingScreenProps) {
  const [mounted, setMounted] = useState(true);
  const [displayCount, setDisplayCount] = useState(0);
  const [activeGlyph, setActiveGlyph] = useState("·");

  const containerRef = useRef<HTMLDivElement>(null);
  const topPanelRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const stringLineRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const exitTriggeredRef = useRef(false);

  // Interactive string wave physics
  const waveRef = useRef({
    amplitude: 0,
    targetAmp: 0,
    frequency: 0.08,
    decay: 0.94,
    mouseCrossY: 0,
  });

  useEffect(() => {
    // Check user preferences
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const hasLoadedBefore =
      typeof window !== "undefined" &&
      sessionStorage.getItem("catalyze_visited");

    if (hasLoadedBefore && prefersReducedMotion) {
      window.dispatchEvent(new CustomEvent("preloader-complete"));
      if (onComplete) onComplete();
      requestAnimationFrame(() => setMounted(false));
      return;
    }

    // Prevent scroll without destroying scrollbar track to eliminate the 2-3px horizontal layout shift
    const preventScroll = (e: Event) => {
      e.preventDefault();
    };
    const preventKeyScroll = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "Space", "PageUp", "PageDown", "Home", "End"].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventKeyScroll);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Magnetic Centerpiece Drift
    const handleMouseMove = (e: MouseEvent) => {
      if (!coreRef.current) return;
      const normX = (e.clientX / width - 0.5) * 2;
      const normY = (e.clientY / height - 0.5) * 2;

      gsap.to(coreRef.current, {
        x: normX * 14,
        y: normY * 10,
        duration: 0.8,
        ease: "power2.out",
      });

      // String pluck physics on mouse proximity
      const centerY = height / 2;
      const distFromCenter = Math.abs(e.clientY - centerY);
      if (distFromCenter < 50) {
        waveRef.current.targetAmp = (50 - distFromCenter) * 0.45 * (e.movementY > 0 ? 1 : -1);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 2. Interactive SVG String Wave Animation Loop
    let animId: number;
    let phase = 0;

    const renderWave = () => {
      const w = waveRef.current;
      w.amplitude += (w.targetAmp - w.amplitude) * 0.15;
      w.targetAmp *= w.decay;

      phase += 0.12;
      const currentAmp = w.amplitude * Math.sin(phase);

      if (pathRef.current) {
        // Subtle bezier curve representing an oscillating string
        const midY = 10 + currentAmp;
        pathRef.current.setAttribute("d", `M 0 10 Q 100 ${midY} 200 10`);
      }

      animId = requestAnimationFrame(renderWave);
    };

    renderWave();

    // 3. Guaranteed Progress Engine
    const progressState = { value: 0 };

    const executeExit = () => {
      if (exitTriggeredRef.current) return;
      exitTriggeredRef.current = true;

      sessionStorage.setItem("catalyze_visited", "true");

      const exitTl = gsap.timeline({
        onComplete: () => {
          window.removeEventListener("wheel", preventScroll);
          window.removeEventListener("touchmove", preventScroll);
          window.removeEventListener("keydown", preventKeyScroll);
          window.removeEventListener("mousemove", handleMouseMove);
          cancelAnimationFrame(animId);
          setMounted(false);
          if (onComplete) onComplete();
        },
      });

      // Step A: Minimal core collapses with crisp scale & fade
      if (coreRef.current) {
        exitTl.to(coreRef.current, {
          scale: 0.85,
          opacity: 0,
          duration: 0.3,
          ease: "power3.in",
        });
      }

      // Step B: Vertical shutter parts cleanly
      const easeCurtain = "expo.inOut";
      if (topPanelRef.current) {
        exitTl.to(
          topPanelRef.current,
          {
            yPercent: -100,
            duration: 0.85,
            ease: easeCurtain,
          },
          0.1
        );
      }

      if (bottomPanelRef.current) {
        exitTl.to(
          bottomPanelRef.current,
          {
            yPercent: 100,
            duration: 0.85,
            ease: easeCurtain,
          },
          0.1
        );
      }

      // Trigger the hero section right as the split occurs
      exitTl.add(() => {
        window.dispatchEvent(new CustomEvent("preloader-complete"));
      }, 0.25);
    };

    // Preload assets and drive progress smoothly
    const assetPromises = CRITICAL_ASSETS.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });

    const fontPromise =
      typeof document !== "undefined" && document.fonts
        ? document.fonts.ready.catch(() => {})
        : Promise.resolve();

    const masterTween = gsap.to(progressState, {
      value: 100,
      duration: minDuration / 1000,
      ease: "power2.out",
      onUpdate: () => {
        const val = Math.round(progressState.value);
        setDisplayCount(val);

        // Update morphing ASCII glyph based on progress
        const glyphIdx = Math.min(
          GLYPH_STAGES.length - 1,
          Math.floor((val / 100) * GLYPH_STAGES.length)
        );
        setActiveGlyph(GLYPH_STAGES[glyphIdx]);
      },
      onComplete: () => {
        Promise.all([...assetPromises, fontPromise]).then(() => {
          setTimeout(executeExit, 60);
        });
      },
    });

    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventKeyScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
      masterTween.kill();
    };
  }, [minDuration, onComplete]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[100] pointer-events-auto select-none overflow-hidden bg-transparent"
    >
      {/* Top Shutter Curtain */}
      <div
        ref={topPanelRef}
        className="absolute top-0 left-0 right-0 h-1/2 bg-[#08070d] z-10 will-change-transform"
      />

      {/* Bottom Shutter Curtain */}
      <div
        ref={bottomPanelRef}
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#08070d] z-10 will-change-transform"
      />

      {/* Centerpiece: Hyper-Minimal, Elegant Focal Core */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 pointer-events-auto">
        <div
          ref={coreRef}
          className="flex flex-col items-center justify-center py-6 px-10 cursor-default"
        >
          {/* Subtle Kinetic ASCII Metamorphosis Glyph */}
          <div className="mb-4 h-6 flex items-center justify-center">
            <span className="font-mono text-sm sm:text-base text-violet-400 font-bold transition-all duration-150">
              {activeGlyph}
            </span>
          </div>

          {/* Understated, Quiet Brand Mark (Refined scale that doesn't spoil the Hero) */}
          <h2 className="text-xs sm:text-sm font-semibold tracking-[0.38em] uppercase font-[family-name:var(--font-syne)] text-white/90 select-none">
            CATALYZE
          </h2>

          {/* Interactive Oscillating Horizon String (Reacts to cursor movement) */}
          <div className="my-4 w-44 sm:w-52 h-5 flex items-center justify-center relative overflow-visible">
            <svg
              ref={stringLineRef}
              viewBox="0 0 200 20"
              className="w-full h-full stroke-white/25 hover:stroke-violet-400 transition-colors duration-300"
              fill="none"
              strokeWidth="1.2"
              strokeLinecap="round"
            >
              <path ref={pathRef} d="M 0 10 Q 100 10 200 10" />
            </svg>

            {/* Micro traveling light pip tracking percentage */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full pointer-events-none will-change-[left] shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              style={{
                left: `${displayCount}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          {/* Precision Tabular Monospace Counter */}
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.25em] text-white/40 uppercase tabular-nums">
            {displayCount < 10
              ? `00${displayCount}`
              : displayCount < 100
              ? `0${displayCount}`
              : displayCount}
          </div>
        </div>
      </div>
    </div>
  );
}
