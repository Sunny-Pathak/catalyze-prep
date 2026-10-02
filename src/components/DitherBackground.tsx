"use client";

import React, { useRef, useEffect } from "react";

export function DitherBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationId: number;

    const loop = () => {
      // Silky smooth inertia
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      if (glow) {
        glow.style.transform = `translate3d(${currentX - 350}px, ${currentY - 350}px, 0)`;
      }

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07060b]"
    >
      {/* Volumetric ambient violet aurora glow - No spots, no dots */}
      <div
        ref={glowRef}
        className="absolute w-[700px] h-[700px] rounded-full bg-radial from-violet-600/12 via-purple-900/6 to-transparent blur-[140px] will-change-transform opacity-75"
      />

      {/* Subtle deep indigo vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#07060b]/60 to-[#07060b] pointer-events-none" />
    </div>
  );
}
