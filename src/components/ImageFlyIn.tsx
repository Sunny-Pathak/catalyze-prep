"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles, Target, Zap, Clock, ShieldCheck, ChevronRight } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SatelliteCard {
  id: string;
  title: string;
  badge: string;
  value: string;
  subtext: string;
  progress: number;
  icon: React.ReactNode;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  flyOrigin: { x: number; y: number; z: number; rotate: number };
}

const CARDS: SatelliteCard[] = [
  {
    id: "card-quant",
    title: "Quant Mastery",
    badge: "TARGET 99.4%ile",
    value: "18 / 3,160",
    subtext: "Avg Speed: 1.4m/Q • Accuracy 91%",
    progress: 18 / 100,
    icon: <Zap className="w-3.5 h-3.5 text-violet-400" />,
    position: { top: "14%", left: "6%" },
    flyOrigin: { x: -80, y: -60, z: -150, rotate: -6 },
  },
  {
    id: "card-drills",
    title: "Daily Drills",
    badge: "QUOTA ACTIVE",
    value: "0 / 3 Done",
    subtext: "Deep Focus 45m Block Remaining",
    progress: 25,
    icon: <Clock className="w-3.5 h-3.5 text-violet-300" />,
    position: { top: "16%", right: "6%" },
    flyOrigin: { x: 80, y: -50, z: -150, rotate: 6 },
  },
  {
    id: "card-varc",
    title: "VARC Comprehension",
    badge: "99.8%ile RC",
    value: "15 / 620",
    subtext: "Philosophy & Economics Passages",
    progress: 35,
    icon: <Target className="w-3.5 h-3.5 text-indigo-400" />,
    position: { bottom: "18%", left: "8%" },
    flyOrigin: { x: -90, y: 70, z: -120, rotate: -4 },
  },
  {
    id: "card-streak",
    title: "Discipline Streak",
    badge: "WEEK 3 • MONTH 1",
    value: "2 Days Active",
    subtext: "Consistency Quotient: 98.4%",
    progress: 75,
    icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />,
    position: { bottom: "16%", right: "8%" },
    flyOrigin: { x: 90, y: 80, z: -120, rotate: 5 },
  },
];

export function ImageFlyIn() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];

    // Initial Fly-In entrance animation (from depth to viewport)
    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        const origin = CARDS[i].flyOrigin;

        gsap.fromTo(
          card,
          {
            x: origin.x * 1.6,
            y: origin.y * 1.6,
            scale: 0.55,
            opacity: 0,
            rotation: origin.rotate * 1.5,
            filter: "blur(8px)",
          },
          {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            rotation: origin.rotate,
            filter: "blur(0px)",
            duration: 1.6,
            delay: 0.4 + i * 0.15,
            ease: "power3.out",
          }
        );

        // Ambient gentle floating motion
        gsap.to(card, {
          y: `+=${10 + i * 3}`,
          rotation: origin.rotate + (i % 2 === 0 ? 1.5 : -1.5),
          duration: 3 + i * 0.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 2 + i * 0.2,
        });
      });

      // Scroll out effect - disperse outward smoothly as user scrolls
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
        onUpdate: (self) => {
          const progress = self.progress;
          cards.forEach((card, i) => {
            const origin = CARDS[i].flyOrigin;
            gsap.set(card, {
              x: origin.x * progress * 2,
              y: origin.y * progress * 2,
              opacity: 1 - progress * 1.4,
              scale: 1 - progress * 0.3,
            });
          });
        },
      });
    }, container);

    // Mouse movement magnetic parallax
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const mouseX = (e.clientX / innerWidth - 0.5) * 2;
      const mouseY = (e.clientY / innerHeight - 0.5) * 2;

      cards.forEach((card, i) => {
        const factor = (i + 1) * 8;
        gsap.to(card, {
          x: mouseX * factor,
          y: mouseY * factor,
          duration: 1.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden hidden md:block"
      style={{ perspective: "1000px" }}
    >
      {CARDS.map((card, idx) => (
        <div
          key={card.id}
          ref={(el) => {
            cardsRef.current[idx] = el;
          }}
          style={{
            ...card.position,
            transformStyle: "preserve-3d",
          }}
          className="pointer-events-auto absolute w-72 rounded-2xl border border-violet-500/20 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-violet-400/50 hover:bg-slate-900/80 hover:shadow-violet-900/20 group cursor-pointer"
        >
          {/* Subtle glow border effect on hover */}
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-violet-600/10 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Card Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-violet-950/80 border border-violet-500/30">
                {card.icon}
              </span>
              <span className="text-xs font-semibold text-slate-300 tracking-wide font-mono">
                {card.title}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {card.badge}
            </span>
          </div>

          {/* Card Value */}
          <div className="flex items-baseline justify-between mt-1 mb-2">
            <span className="text-xl font-bold font-mono tracking-tight text-white group-hover:text-violet-200 transition-colors">
              {card.value}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 mb-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-violet-500 to-indigo-400 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(card.progress, 100)}%` }}
            />
          </div>

          {/* Subtext info */}
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>{card.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
