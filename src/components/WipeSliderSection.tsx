"use client";

import React, { useRef, useEffect, useState } from "react";

const FEATURES = [
  {
    num: "01",
    label: "QUANTITATIVE APTITUDE",
    quote: "We suffer more often in imagination than in reality. Master the structure of numbers, and chaos dissolves.",
    metric: "3,160 PROBLEMS INDEXED · ARITHMETIC & ALGEBRA SYNTHESIS",
  },
  {
    num: "02",
    label: "DATA INTERPRETATION & REASONING",
    quote: "The impediment to action advances action. What stands in the way becomes the way.",
    metric: "650 HIGH-DIFFICULTY SETS · SELECTION INTUITION ENGINE",
  },
  {
    num: "03",
    label: "VERBAL ABILITY & COMPREHENSION",
    quote: "The soul becomes dyed with the color of its thoughts. Read with detachment; infer with unyielding truth.",
    metric: "620 DIALECTICAL PASSAGES · INFERENCE TELEMETRY",
  },
  {
    num: "04",
    label: "THE CONSISTENCY MATRIX",
    quote: "How long are you going to wait before you demand the best for yourself? First say what you would be; then do what you must.",
    metric: "16 WEEKS DAILY EXECUTION · UNBROKEN STREAK PROTOCOL",
  },
];

export function WipeSliderSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

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
      const rectBottom = rectTop + sectionHeight;
      const scrolled = -rectTop;
      const prog = Math.min(1, Math.max(0, scrolled / totalScrollable));

      setScrollProgress(prog);

      const isPast = rectBottom < windowH - 10;
      const isBefore = rectTop > 10;
      const isActive = !isBefore && !isPast;

      // Broadcast to ASCII sculpture canvas
      if (typeof window !== "undefined") {
        (window as any).__stoicSection2 = {
          isActive,
          isPast,
          progress: prog,
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

  // Axiom center points across the scroll progression
  // 0.00 -> 0.12 is transition prologue first
  const centers = [0.18, 0.36, 0.54, 0.72];
  const halfSpan = 0.09;

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative w-full h-[460vh] bg-transparent text-white select-none pointer-events-auto"
    >
      {/* Sticky Fullscreen Viewport: Stays locked in place across the 550vh scroll travel */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center p-8 sm:p-14 overflow-hidden z-20">
        {/* Subtle hairline edge progress tracker - pure minimal line, zero text clutter */}
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-white/[0.03] z-30 pointer-events-none">
          <div
            className="h-full bg-violet-400/80 transition-all duration-75"
            style={{ width: `${Math.round(scrollProgress * 100)}%` }}
          />
        </div>

        {/* Main Stage: Left 55% width, reveals transition prologue first, then features one by one */}
        <div
          id="philosophical-quote-stage"
          className="relative z-20 w-full lg:max-w-[55%] my-auto min-h-[360px] flex flex-col justify-center"
        >
          {/* Transition Prologue between Image 1 & 2: Awakens the empty space with atmospheric Stoic presence */}
          {scrollProgress < 0.14 && (
            <div
              className="absolute inset-0 flex flex-col justify-center transition-opacity duration-150 pointer-events-none"
              style={{
                opacity: Math.max(0, 1 - scrollProgress / 0.11),
                transform: `translateY(${scrollProgress * -25}px)`,
              }}
            >
              {/* ASCII Header Frame */}
              <div className="text-[11px] font-mono tracking-[0.25em] text-violet-400 uppercase mb-4 flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-violet-400 rotate-45" />
                <span>PHASE II · THE FOUR PILLARS</span>
                <span className="text-slate-600 font-normal">// 01 → 04</span>
              </div>

              {/* Atmospheric Title */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif italic text-white/95 leading-tight mb-4 drop-shadow-[0_0_30px_rgba(192,132,252,0.25)]">
                The architecture of an unyielding mind.
              </h2>

              {/* Subtext with Stoic resonance */}
              <p className="text-xs sm:text-sm font-mono tracking-wider text-slate-400 leading-relaxed max-w-lg mb-6">
                From contemplation to calibrated action. The sculpture awakens to index each cognitive discipline.
              </p>

              {/* Minimalist prompt indicator */}
              <div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.2em] text-violet-400/80 uppercase">
                <span className="animate-pulse">↓</span>
                <span>SCROLL TO ENGAGE PROTOCOL</span>
              </div>
            </div>
          )}

          {FEATURES.map((item, idx) => {
            const center = centers[idx];
            const dist = Math.abs(scrollProgress - center);
            const opacity = Math.max(0, 1 - dist / halfSpan);
            const translateY = (scrollProgress - center) * -40;
            const factor = Math.min(1, opacity * 1.3);

            if (factor < 0.01) return null;

            return (
              <div
                key={item.num}
                className="absolute inset-0 flex flex-col justify-center transition-opacity duration-150"
                style={{
                  opacity: factor,
                  transform: `translateY(${translateY}px)`,
                }}
              >
                {/* Feature Number & Name */}
                <div className="text-[11px] font-mono tracking-[0.25em] text-violet-400 uppercase mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-violet-400" />
                  <span>
                    {item.num} · {item.label}
                  </span>
                </div>

                {/* Philosophical Quote */}
                <blockquote className="border-l-2 border-violet-400 pl-6 text-2xl sm:text-3xl lg:text-4xl font-serif italic text-white/95 leading-relaxed drop-shadow-[0_0_30px_rgba(192,132,252,0.35)]">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>

                {/* Minimal Quota Telemetry */}
                <div className="mt-6 pt-4 border-t border-white/10 text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                  {item.metric}
                </div>
              </div>
            );
          })}

          {/* Threshold Climax: Awakens when Marcus Aurelius gestures to the left horizon (0.78 -> 1.00) */}
          {scrollProgress >= 0.78 && (
            <div
              className="absolute inset-0 flex flex-col justify-center transition-opacity duration-200 pointer-events-none"
              style={{
                opacity: Math.min(1, Math.max(0, (scrollProgress - 0.78) / 0.08)),
                transform: `translateY(${(scrollProgress - 0.88) * -25}px)`,
              }}
            >
              {/* ASCII Header Frame */}
              <div className="text-[11px] font-mono tracking-[0.25em] text-violet-400 uppercase mb-4 flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-violet-400 rotate-45 animate-pulse" />
                <span>THRESHOLD · THE HORIZON</span>
                <span className="text-slate-600 font-normal">// FLIGHT VECTOR</span>
              </div>

              {/* Climax Stoic Directive */}
              <blockquote className="border-l-2 border-violet-400 pl-6 text-2xl sm:text-3xl lg:text-4xl font-serif italic text-white/95 leading-relaxed drop-shadow-[0_0_30px_rgba(192,132,252,0.35)]">
                &ldquo;What stands in the way becomes the way. Contemplation yields to the leap.&rdquo;
              </blockquote>

              {/* Minimal subtext */}
              <p className="mt-4 pl-6 text-xs sm:text-sm font-mono tracking-wider text-slate-400 leading-relaxed max-w-lg">
                The four disciplines are sealed. The soul awakens from stone to cross the celestial plane.
              </p>

              {/* Minimalist prompt indicator aligned with his pointing arm */}
              <div className="mt-8 pl-6 flex items-center gap-3 text-[10px] font-mono tracking-[0.2em] text-violet-400/90 uppercase">
                <span className="animate-pulse">↓</span>
                <span>SCROLL TO INITIATE ASCENT</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
