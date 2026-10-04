"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";

interface LnVectorCutoutProps {
  pillarIndex: number;
  invertFactor?: number;
  scrollDelta?: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Edge {
  a: number;
  b: number;
  dashed?: boolean;
}

// 1. Icosahedron & Golden Ratio Stellation (Pillar 01: Quant)
const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSA_VERTS: Point3D[] = [
  { x: -1, y: PHI, z: 0 },
  { x: 1, y: PHI, z: 0 },
  { x: -1, y: -PHI, z: 0 },
  { x: 1, y: -PHI, z: 0 },
  { x: 0, y: -1, z: PHI },
  { x: 0, y: 1, z: PHI },
  { x: 0, y: -1, z: -PHI },
  { x: 0, y: 1, z: -PHI },
  { x: PHI, y: 0, z: -1 },
  { x: PHI, y: 0, z: 1 },
  { x: -PHI, y: 0, z: -1 },
  { x: -PHI, y: 0, z: 1 },
].map((v) => ({ x: v.x * 52, y: v.y * 52, z: v.z * 52 }));

const ICOSA_EDGES: Edge[] = [];
for (let i = 0; i < ICOSA_VERTS.length; i++) {
  for (let j = i + 1; j < ICOSA_VERTS.length; j++) {
    const dx = ICOSA_VERTS[i].x - ICOSA_VERTS[j].x;
    const dy = ICOSA_VERTS[i].y - ICOSA_VERTS[j].y;
    const dz = ICOSA_VERTS[i].z - ICOSA_VERTS[j].z;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq > 10000 && distSq < 11800) {
      ICOSA_EDGES.push({ a: i, b: j });
    }
  }
}

// 2. 4D Hypercube / Tesseract (Pillar 02: DILR)
const TESSERACT_VERTS: Point3D[] = [];
const sOuter = 70;
const sInner = 36;
for (const x of [-1, 1]) {
  for (const y of [-1, 1]) {
    for (const z of [-1, 1]) {
      TESSERACT_VERTS.push({ x: x * sOuter, y: y * sOuter, z: z * sOuter });
    }
  }
}
for (const x of [-1, 1]) {
  for (const y of [-1, 1]) {
    for (const z of [-1, 1]) {
      TESSERACT_VERTS.push({ x: x * sInner, y: y * sInner, z: z * sInner });
    }
  }
}

const TESSERACT_EDGES: Edge[] = [];
for (let i = 0; i < 8; i++) {
  for (let j = i + 1; j < 8; j++) {
    const diff = (i ^ j);
    if (diff === 1 || diff === 2 || diff === 4) {
      TESSERACT_EDGES.push({ a: i, b: j });
      TESSERACT_EDGES.push({ a: i + 8, b: j + 8, dashed: true });
    }
  }
  TESSERACT_EDGES.push({ a: i, b: i + 8 });
}

// 3. Gyroscopic Astrolabe (Pillar 03: VARC)
const ASTRO_POINTS_R1: Point3D[] = [];
const ASTRO_POINTS_R2: Point3D[] = [];
const ASTRO_POINTS_R3: Point3D[] = [];
const N_SEGS = 24;
for (let i = 0; i < N_SEGS; i++) {
  const theta = (i * Math.PI * 2) / N_SEGS;
  ASTRO_POINTS_R1.push({ x: Math.cos(theta) * 78, y: Math.sin(theta) * 78, z: 0 });
  ASTRO_POINTS_R2.push({ x: 0, y: Math.cos(theta) * 64, z: Math.sin(theta) * 64 });
  ASTRO_POINTS_R3.push({ x: Math.cos(theta) * 50, y: 0, z: Math.sin(theta) * 50 });
}

// 4. Stepped Isometric Matrix (Pillar 04: Streak)
const MATRIX_VERTS: Point3D[] = [];
const MATRIX_EDGES: Edge[] = [];
const tiers = [
  { size: 70, y: 32 },
  { size: 52, y: 9 },
  { size: 34, y: -14 },
  { size: 16, y: -37 },
];
let vOffset = 0;
tiers.forEach((t) => {
  const vStart = vOffset;
  MATRIX_VERTS.push({ x: -t.size, y: t.y, z: -t.size });
  MATRIX_VERTS.push({ x: t.size, y: t.y, z: -t.size });
  MATRIX_VERTS.push({ x: t.size, y: t.y, z: t.size });
  MATRIX_VERTS.push({ x: -t.size, y: t.y, z: t.size });
  MATRIX_EDGES.push({ a: vStart, b: vStart + 1 });
  MATRIX_EDGES.push({ a: vStart + 1, b: vStart + 2 });
  MATRIX_EDGES.push({ a: vStart + 2, b: vStart + 3 });
  MATRIX_EDGES.push({ a: vStart + 3, b: vStart });
  vOffset += 4;
});
for (let k = 0; k < 3; k++) {
  const base = k * 4;
  const next = (k + 1) * 4;
  for (let c = 0; c < 4; c++) {
    MATRIX_EDGES.push({ a: base + c, b: next + c, dashed: c % 2 === 1 });
  }
}

export function LnVectorCutout({ pillarIndex, invertFactor = 1.0, scrollDelta = 0 }: LnVectorCutoutProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ rx: 0.35, ry: 0.5, rz: 0.1 });
  const mouseRef = useRef({ targetX: 0, targetY: 0, curX: 0, curY: 0 });
  const spinBoostRef = useRef(0);

  const inv = invertFactor;
  const strokeColor = inv > 0.5 ? "#28193d" : "#ede9fe";
  const strokeColorDim = inv > 0.5 ? "#6d28d9" : "#c4b5fd";
  const accentColor = inv > 0.5 ? "#7c3aed" : "#a855f7";

  // Mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 1.5;
      const y = (e.clientY / window.innerHeight - 0.5) * 1.5;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Continuous rotation loop linked to time + scroll wheel delta
  useEffect(() => {
    let animId: number;
    let t = 0;
    const loop = () => {
      t += 0.01;
      spinBoostRef.current *= 0.92; // smooth decay for scroll spin
      mouseRef.current.curX += (mouseRef.current.targetX - mouseRef.current.curX) * 0.06;
      mouseRef.current.curY += (mouseRef.current.targetY - mouseRef.current.curY) * 0.06;

      const totalScrollSpin = scrollDelta * 2.5 + spinBoostRef.current;

      setRotation({
        rx: 0.35 + Math.sin(t * 0.5) * 0.15 + mouseRef.current.curY * 0.45,
        ry: t * 0.65 + totalScrollSpin + mouseRef.current.curX * 0.6,
        rz: Math.cos(t * 0.3) * 0.1,
      });
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [scrollDelta]);

  // GSAP 3D Spin Twist & Staggered Stroke Draw when changing pillars
  useEffect(() => {
    if (!svgRef.current) return;
    spinBoostRef.current = 2.4; // dramatic satisfying spin impulse on pillar switch

    const ctx = gsap.context(() => {
      gsap.fromTo(
        svgRef.current,
        { scale: 0.72, opacity: 0.15, rotate: -30 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.65, ease: "back.out(1.6)" }
      );
      gsap.fromTo(
        ".ln-edge",
        { strokeDashoffset: 160, opacity: 0 },
        { strokeDashoffset: 0, opacity: 1, duration: 0.75, stagger: 0.01, ease: "power2.out" }
      );
    }, svgRef);

    return () => ctx.revert();
  }, [pillarIndex]);

  // Project 3D Point to 2D Screen
  const project = (p: Point3D) => {
    const cosX = Math.cos(rotation.rx);
    const sinX = Math.sin(rotation.rx);
    const cosY = Math.cos(rotation.ry);
    const sinY = Math.sin(rotation.ry);
    const cosZ = Math.cos(rotation.rz);
    const sinZ = Math.sin(rotation.rz);

    const x1 = p.x * cosY + p.z * sinY;
    const y1 = p.y;
    const z1 = -p.x * sinY + p.z * cosY;

    const x2 = x1;
    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    const x3 = x2 * cosZ - y2 * sinZ;
    const y3 = x2 * sinZ + y2 * cosZ;
    const z3 = z2;

    const fov = 320;
    const pz = z3 + 360;
    const scale = fov / pz;
    const cx = 120;
    const cy = 115;

    return {
      x: cx + x3 * scale,
      y: cy + y3 * scale,
      z: z3,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center select-none w-full max-w-[240px] h-[210px]"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 240 230"
        className="w-full h-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id="ln-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={accentColor} floodOpacity="0.4" />
          </filter>
        </defs>

        {/* 1. QUANT: Icosahedron Wireframe */}
        {pillarIndex === 0 && (() => {
          const pts = ICOSA_VERTS.map(project);
          return (
            <g filter="url(#ln-glow)">
              {ICOSA_EDGES.map((e, idx) => {
                const p1 = pts[e.a];
                const p2 = pts[e.b];
                const avgZ = (p1.z + p2.z) / 2;
                const alpha = Math.min(1, Math.max(0.25, (avgZ + 100) / 200));
                return (
                  <line
                    key={idx}
                    className="ln-edge"
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={strokeColor}
                    strokeWidth={avgZ > 0 ? "1.4" : "0.9"}
                    strokeOpacity={alpha}
                    strokeDasharray="140"
                  />
                );
              })}
              {pts.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={p.z > 0 ? 2.5 : 1.5}
                  fill={p.z > 0 ? accentColor : strokeColorDim}
                  opacity={p.z > 0 ? 0.95 : 0.4}
                />
              ))}
            </g>
          );
        })()}

        {/* 2. DILR: 4D Tesseract Hypercube */}
        {pillarIndex === 1 && (() => {
          const pts = TESSERACT_VERTS.map(project);
          return (
            <g filter="url(#ln-glow)">
              {TESSERACT_EDGES.map((e, idx) => {
                const p1 = pts[e.a];
                const p2 = pts[e.b];
                const avgZ = (p1.z + p2.z) / 2;
                const alpha = Math.min(1, Math.max(0.3, (avgZ + 120) / 240));
                return (
                  <line
                    key={idx}
                    className="ln-edge"
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={strokeColor}
                    strokeWidth={e.dashed ? "1.0" : avgZ > 0 ? "1.5" : "1.0"}
                    strokeDasharray={e.dashed ? "3 3" : "140"}
                    strokeOpacity={alpha}
                  />
                );
              })}
              {pts.map((p, idx) => (
                <rect
                  key={idx}
                  x={p.x - 1.5}
                  y={p.y - 1.5}
                  width="3"
                  height="3"
                  fill={accentColor}
                  opacity={p.z > 0 ? 0.9 : 0.35}
                />
              ))}
            </g>
          );
        })()}

        {/* 3. VARC: Gyroscopic Astrolabe */}
        {pillarIndex === 2 && (() => {
          const ptsR1 = ASTRO_POINTS_R1.map(project);
          const ptsR2 = ASTRO_POINTS_R2.map(project);
          const ptsR3 = ASTRO_POINTS_R3.map(project);

          const renderLoop = (pts: ReturnType<typeof project>[], sc: string, isDashed?: boolean) => {
            let pathD = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} `;
            for (let i = 1; i < pts.length; i++) {
              pathD += `L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} `;
            }
            pathD += "Z";
            return (
              <path
                d={pathD}
                fill="none"
                stroke={sc}
                strokeWidth="1.2"
                strokeDasharray={isDashed ? "4 4" : "none"}
                className="ln-edge"
              />
            );
          };

          return (
            <g filter="url(#ln-glow)">
              {renderLoop(ptsR1, strokeColor)}
              {renderLoop(ptsR2, strokeColorDim, true)}
              {renderLoop(ptsR3, accentColor)}
              <circle cx="120" cy="115" r="3" fill={strokeColor} />
              <circle cx="120" cy="115" r="6" fill="none" stroke={accentColor} strokeWidth="0.8" />
            </g>
          );
        })()}

        {/* 4. STREAK: Stepped Matrix Monolith */}
        {pillarIndex === 3 && (() => {
          const pts = MATRIX_VERTS.map(project);
          return (
            <g filter="url(#ln-glow)">
              {MATRIX_EDGES.map((e, idx) => {
                const p1 = pts[e.a];
                const p2 = pts[e.b];
                const avgZ = (p1.z + p2.z) / 2;
                return (
                  <line
                    key={idx}
                    className="ln-edge"
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={strokeColor}
                    strokeWidth={avgZ > 0 ? "1.4" : "0.9"}
                    strokeDasharray={e.dashed ? "2 3" : "none"}
                    strokeOpacity={avgZ > 0 ? 0.95 : 0.45}
                  />
                );
              })}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
