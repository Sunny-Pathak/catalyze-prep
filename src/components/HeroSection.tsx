"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { KineticHeadline } from "./KineticHeadline";

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const headlineWrapperRef = useRef<HTMLDivElement>(null);
  const bottomMetaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    let tl: gsap.core.Timeline | null = null;

    const updateOnScroll = () => {
      const scrollY = typeof window !== "undefined" ? window.scrollY || window.pageYOffset || 0 : 0;

      // 1. Headline (DISCIPLINE is Real.): fades out smoothly over 0 -> 320px
      const pHead = Math.min(1, Math.max(0, scrollY / 320));
      if (headlineWrapperRef.current) {
        headlineWrapperRef.current.style.opacity = `${(1 - pHead).toFixed(3)}`;
        headlineWrapperRef.current.style.transform = `translate3d(0, ${(-35 * pHead).toFixed(2)}px, 0) scale(${(1 - 0.05 * pHead).toFixed(4)})`;
      }

      // 2. Header (CATALYZE PROTOCOL): fades out over 0 -> 180px
      const pHeader = Math.min(1, Math.max(0, scrollY / 180));
      if (headerRef.current) {
        headerRef.current.style.opacity = `${(1 - pHeader).toFixed(3)}`;
        headerRef.current.style.transform = `translate3d(0, ${(-15 * pHeader).toFixed(2)}px, 0)`;
      }

      // 3. Bottom Meta: fades out over 0 -> 140px
      const pMeta = Math.min(1, Math.max(0, scrollY / 140));
      if (bottomMetaRef.current) {
        bottomMetaRef.current.style.opacity = `${(1 - pMeta).toFixed(3)}`;
        bottomMetaRef.current.style.transform = `translate3d(0, ${(-20 * pMeta).toFixed(2)}px, 0)`;
        bottomMetaRef.current.style.filter = `blur(${(4 * pMeta).toFixed(1)}px)`;
      }
    };

    const handleScroll = () => {
      const currentY = typeof window !== "undefined" ? window.scrollY || window.pageYOffset || 0 : 0;
      // If user deliberately scrolls away (> 30px) during entrance animation, yield control
      if (tl && tl.isActive()) {
        if (currentY > 30) {
          tl.kill();
          tl = null;
        } else {
          return;
        }
      }
      if (!ticking) {
        requestAnimationFrame(() => {
          updateOnScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // If loaded at the very top of the page, play the elegant entrance sequence
    const isAtTop = typeof window !== "undefined" && window.scrollY < 20;
    if (isAtTop) {
      tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        onComplete: () => {
          tl = null;
          updateOnScroll();
        },
      });

      if (headerRef.current) {
        tl.fromTo(
          headerRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 1.2 }
        );
      }

      if (headlineWrapperRef.current) {
        tl.fromTo(
          headlineWrapperRef.current,
          { scale: 0.96, opacity: 0, y: 35 },
          { scale: 1, opacity: 1, y: 0, duration: 1.4 },
          "-=0.9"
        );
      }

      if (bottomMetaRef.current) {
        tl.fromTo(
          bottomMetaRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 1 },
          "-=0.7"
        );
      }
    } else {
      // Refreshed down the page (e.g. Section 2): instantly sync to current scroll offset
      updateOnScroll();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateOnScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateOnScroll);
      if (tl) tl.kill();
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-screen w-full flex flex-col justify-between overflow-hidden bg-transparent text-white p-8 md:p-14 select-none z-20 pointer-events-none"
    >
      {/* 1. Pure Minimal Brand Identity (Top Left) & Quiet Link (Top Right) */}
      <header
        ref={headerRef}
        style={{ opacity: 0 }}
        className="relative z-30 flex items-center justify-between w-full pointer-events-auto"
      >
        <div ref={logoRef} className="flex items-center gap-3 group cursor-pointer">
          <div className="w-2.5 h-2.5 bg-violet-400" />
          <span className="text-sm font-black tracking-[0.28em] uppercase font-[family-name:var(--font-syne)] text-white">
            CATALYZE
          </span>
        </div>

        <a
          href="https://cat-tracker-1538d.web.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          APP ↗
        </a>
      </header>

      {/* 2. Middle Kinetic Headline (Pointer Events Auto) */}
      <div
        ref={headlineWrapperRef}
        style={{ opacity: 0 }}
        className="relative z-20 flex flex-col items-center justify-center my-auto w-full pointer-events-auto"
      >
        <KineticHeadline />
      </div>

      {/* 3. Minimalist Bottom Indicator */}
      <footer
        ref={bottomMetaRef}
        style={{ opacity: 0 }}
        className="relative z-30 flex items-end justify-between w-full text-[10px] md:text-xs font-mono text-slate-500 tracking-widest uppercase pointer-events-auto"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-violet-500" />
          <span>OBSERVATION DEFINES OUTCOME</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-400">SCROLL DOWN</span>
        </div>
      </footer>
    </section>
  );
}
