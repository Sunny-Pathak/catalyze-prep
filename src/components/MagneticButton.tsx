"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  glow?: boolean;
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.35,
  glow = true,
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      xTo(dx * strength);
      yTo(dy * strength);

      if (glowRef.current) {
        const glowX = e.clientX - rect.left;
        const glowY = e.clientY - rect.top;
        glowRef.current.style.transform = `translate(${glowX - 50}px, ${glowY - 50}px)`;
        glowRef.current.style.opacity = "1";
      }
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
      if (glowRef.current) {
        glowRef.current.style.opacity = "0";
      }
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return (
    <button
      ref={buttonRef}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium transition-all duration-300 will-change-transform ${className}`}
      {...props}
    >
      {glow && (
        <span
          ref={glowRef}
          className="pointer-events-none absolute h-24 w-24 rounded-full bg-violet-500/30 blur-xl opacity-0 transition-opacity duration-300 will-change-transform"
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
