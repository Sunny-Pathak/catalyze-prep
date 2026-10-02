"use client";

import React, { useRef, useEffect, useState } from "react";

const ASCII_CHARS = "  ·:+xX#%@$";
const GLITCH_CHARS = "01/\\<>[];:*!#";

// High-performance precomputed Luminance LUT (O(1) table lookup replaces 40,000+ Math.pow calls/frame)
// Single unified calibrated curve ensures seamless marble texture & consistent illumination across all sections
const LUM_LUT = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const norm = i / 255;
  LUM_LUT[i] = Math.pow(norm, 0.95) * 1.05;
}

// Pre-allocated static color tokens (eliminates 40,000+ string allocations/frame & stops GC stutters)
const COLOR_WHITE = "rgba(255, 255, 255, 0.95)";
const COLOR_BLOOM_WHITE = "rgba(255, 255, 255, 1.0)";
const COLOR_LAVENDER = "rgba(233, 213, 255, 0.85)";
const COLOR_VIOLET = "rgba(192, 132, 252, 0.78)";
const COLOR_DEEP_VIOLET = "rgba(139, 92, 246, 0.55)";
const COLOR_BG_DITHER = "rgba(139, 92, 246, 0.04)";

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
}

interface BezierPt {
  x: number;
  y: number;
}

function evalCubicBezier(t: number, p0: BezierPt, p1: BezierPt, p2: BezierPt, p3: BezierPt): BezierPt {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

export function AsciiSculptureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const mouseRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    pixelX: -1000,
    pixelY: -1000,
  });

  const ripplesRef = useRef<Ripple[]>([]);
  const lastActiveIdxRef = useRef<number>(-1);
  const orbPosRef = useRef({ x: 0, y: 0, initialized: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const offCanvas = document.createElement("canvas");
    const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();
    setIsLoaded(true);

    // Load Poses:
    // 1. Classical Roman Bust (Hero center)
    // 2. Standing Contemplative Statue (Initial Section 2 arrival)
    // 3. Feature 1: Pointing across (Quant)
    // 4. Feature 2: Subtle pose variation (DILR)
    // 5. Feature 3: Arm angled lower (VARC)
    // 6. Feature 4: Skeleton Devil on shoulder (Consistency Matrix / Memento Mori)
    const imgPose1 = new Image();
    const imgPose2 = new Image();
    const imgAngel = new Image();

    imgPose1.src = "/assets/stoic_bust.jpg";
    imgPose2.src = "/assets/stoic_pose3.jpg"; // Pure classical marble statue pointing to horizon
    imgAngel.src = "/assets/flight/frame_44.png"; // Majestic classical angel sculpture in center

    // 19 Dense Hero Transformation Frames (Bust -> Standing Statue Video Scrub)
    const heroFrames: HTMLImageElement[] = [];
    const TOTAL_HERO_FRAMES = 19;
    for (let i = 1; i <= TOTAL_HERO_FRAMES; i++) {
      const img = new Image();
      const numStr = i < 10 ? `0${i}` : `${i}`;
      img.src = `/assets/hero/hero_${numStr}.png`;
      heroFrames.push(img);
    }

    let animationFrameId: number;
    let time = 0;

    // Zoom level ref for dimensional perspective transitions
    const zoomState = {
      current: 1.0,
      target: 1.0,
      active: false,
    };

    const handleZoomEvent = (e: any) => {
      if (e && e.detail) {
        zoomState.target = typeof e.detail.zoom === "number" ? e.detail.zoom : 1.0;
        zoomState.active = !!e.detail.active;
      }
    };
    window.addEventListener("stoic-zoom", handleZoomEvent);

    interface AsciiParticle {
      x: number;
      y: number;
      speedY: number;
      speedX: number;
      char: string;
      size: number;
      baseAlpha: number;
      seed: number;
    }

    const PARTICLES: AsciiParticle[] = Array.from({ length: 48 }, () => {
      const chars = ["·", "+", "*", "°", "×", "ø", "·", "~", "¤", "^"];
      return {
        x: Math.random(),
        y: Math.random(),
        speedY: 0.0003 + Math.random() * 0.0006,
        speedX: (Math.random() - 0.5) * 0.0003,
        char: chars[Math.floor(Math.random() * chars.length)],
        size: 9 + Math.random() * 5,
        baseAlpha: 0.14 + Math.random() * 0.28,
        seed: Math.random() * 100,
      };
    });

    const render = () => {
      time += 0.03;

      // Mouse lerp for subtle perspective tilt
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      // Update shockwave ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += 4.5;
        r.strength *= 0.94;
        if (r.radius > r.maxRadius || r.strength < 0.01) {
          ripplesRef.current.splice(i, 1);
        }
      }

      ctx.clearRect(0, 0, width, height);

      if (!offCtx) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const cellSize = width < 768 ? 9 : 8;
      const cols = Math.floor(width / cellSize);
      const rows = Math.floor(height / cellSize);

      if (cols <= 0 || rows <= 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // CRITICAL OPTIMIZATION: Only resize offCanvas when dimensions change.
      // Setting .width / .height every frame forces browser to invalidate and reallocate GPU textures every 16ms!
      if (offCanvas.width !== cols || offCanvas.height !== rows) {
        offCanvas.width = cols;
        offCanvas.height = rows;
      }
      offCtx.clearRect(0, 0, cols, rows);

      const isMobile = width < 1024;

      // Unified Continuous Scroll Measurement across Sections:
      const scrollY = typeof window !== "undefined" ? window.scrollY || window.pageYOffset || 0 : 0;
      const heroThreshold = height || 800;
      const heroProgress = Math.min(1, Math.max(0, scrollY / heroThreshold));

      const s2El = typeof document !== "undefined" ? document.getElementById("features") : null;
      const wormholeEl = typeof document !== "undefined" ? document.getElementById("wormhole") : null;

      let storyProg = 0;
      let wormholeProg = 0;
      let isWormholeActive = false;

      if (wormholeEl) {
        const wRect = wormholeEl.getBoundingClientRect();
        const wTop = wRect.top;
        const wHeight = wRect.height;
        const wScrollable = wHeight - height;
        if (wScrollable > 0) {
          const scrolled = -wTop;
          wormholeProg = Math.min(1, Math.max(0, scrolled / wScrollable));
          isWormholeActive = wTop <= 0 && wRect.bottom >= height;
        } else if (wTop <= 0) {
          wormholeProg = 1;
        }
      }

      // Also read window.__stoicWormhole if available
      const wormholeState = (typeof window !== "undefined" && (window as any).__stoicWormhole) || null;
      if (wormholeState && wormholeState.progress !== undefined) {
        wormholeProg = Math.max(wormholeProg, wormholeState.progress);
        if (wormholeState.isActive) isWormholeActive = true;
      }

      // The angel flight completes across the first 45% of wormhole scroll:
      storyProg = Math.min(1, Math.max(0, wormholeProg / 0.45));

      // Celestial Dawn Aura Factor (soft royal-violet and warm alabaster glow behind Angel):
      let dawnAura = 0;
      if (wormholeProg > 0.04) {
        const dT = Math.min(1, Math.max(0, (wormholeProg - 0.04) / 0.18));
        dawnAura = dT * dT * (3 - 2 * dT);
      }

      // Compute Camera Motion Intensity (gentle sway only during starlight flight phase)
      let currentShakeIntensity = 0;
      if (wormholeProg > 0.06 && wormholeProg <= 0.25) {
        currentShakeIntensity = ((wormholeProg - 0.06) / 0.19) * 1.5;
      } else if (wormholeProg > 0.25 && wormholeProg <= 0.42) {
        currentShakeIntensity = 1.5 * (1 - (wormholeProg - 0.25) / 0.17);
      } else {
        currentShakeIntensity = 0;
      }

      let canvasShakeX = 0;
      let canvasShakeY = 0;
      const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (currentShakeIntensity > 0 && !prefersReducedMotion) {
        canvasShakeX = Math.sin(time * 2.8) * (currentShakeIntensity * 0.35);
        canvasShakeY = Math.cos(time * 2.2) * (currentShakeIntensity * 0.25);
      }

      // Scroll-driven camera push-in (scales smoothly from 1.0 to 1.95x when reaching angel section):
      let targetZoom = 1.0;
      if (wormholeProg > 0.45) {
        const zT = Math.min(1, (wormholeProg - 0.45) / 0.12);
        targetZoom = 1.0 + zT * zT * (3 - 2 * zT) * 0.95;
      }
      if (zoomState.active) {
        targetZoom = Math.max(targetZoom, zoomState.target);
      }
      zoomState.current += (targetZoom - zoomState.current) * 0.08;
      const currentZoom = zoomState.current;

      // Keep canvas pin-sharp at all zoom levels (eliminates optic blur and text fuzziness)
      if (canvasRef.current) {
        canvasRef.current.style.filter = "none";
        canvasRef.current.style.transform = "none";
      }

      let p1Alpha = 0;
      let p2Alpha = 0;
      let horizontalRatio = 0.5;

      if (wormholeProg <= 0.01) {
        // Hero Section (Bust -> Standing Statue):
        if (heroProgress < 0.45) {
          p1Alpha = 1;
          p2Alpha = 0;
          horizontalRatio = 0.5;
        } else {
          // As Wormhole approaches (0.45 -> 1.0):
          // Smooth Hermite glide from center (0.5) to right (0.76)
          const t = (heroProgress - 0.45) / 0.53;
          const smoothT = t * t * (3 - 2 * t);
          p1Alpha = 1 - smoothT;
          p2Alpha = smoothT;
          horizontalRatio = 0.5 + smoothT * 0.26;
        }
      } else {
        // Wormhole Section (Flight & Angel):
        horizontalRatio = 0.76;
        p1Alpha = 0;
        p2Alpha = 1;
      }

      const targetCenterX = isMobile ? cols * 0.5 : cols * horizontalRatio;
      const targetCenterY = rows * 0.52;

      const tiltX = mouseRef.current.x * 8;
      const tiltY = mouseRef.current.y * 8;

      const pose1Ready = imgPose1.complete && imgPose1.naturalWidth > 0;
      const pose2Ready = imgPose2.complete && imgPose2.naturalWidth > 0;

      let currentDrawW = 0;
      let currentDrawH = 0;

      // 1. Draw Hero Transformation (Bust -> Standing Statue Video Scrub)
      if (wormholeProg <= 0.01 && heroProgress < 0.98) {
        const heroFrameFloat = (heroProgress < 0.40 ? 0 : Math.min(1, (heroProgress - 0.40) / 0.58)) * (heroFrames.length - 1);
        const hIdxA = Math.floor(heroFrameFloat);
        const hIdxB = Math.min(heroFrames.length - 1, hIdxA + 1);
        const hFrac = heroFrameFloat - hIdxA;
        const hWeightB = hFrac * hFrac * (3 - 2 * hFrac);

        const hImgA = heroFrames[hIdxA];
        const hImgB = heroFrames[hIdxB];

        if (hImgA && hImgA.complete && hImgA.naturalWidth > 0) {
          offCtx.save();
          offCtx.globalAlpha = 1.0;

          const aspect = hImgA.width / hImgA.height;
          let drawH = rows * 0.95;
          let drawW = drawH * aspect;
          if (drawW > cols * 0.70 && !isMobile) {
            drawW = cols * 0.70;
            drawH = drawW / aspect;
          }
          currentDrawW = drawW;
          currentDrawH = drawH;

          const drawX = targetCenterX - drawW / 2 + tiltX / cellSize;
          const drawY = targetCenterY - drawH / 2 + tiltY / cellSize;

          offCtx.drawImage(hImgA, drawX, drawY, drawW, drawH);
          if (hImgB && hImgB.complete && hImgB.naturalWidth > 0 && hWeightB > 0.01) {
            offCtx.globalAlpha = hWeightB;
            offCtx.drawImage(hImgB, drawX, drawY, drawW, drawH);
          }
          offCtx.restore();
        } else if (pose1Ready && p1Alpha > 0.01) {
          // Fallback to static bust
          offCtx.save();
          offCtx.globalAlpha = p1Alpha;
          const img1Aspect = imgPose1.width / imgPose1.height;
          let drawH1 = rows * 0.94;
          let drawW1 = drawH1 * img1Aspect;
          const drawX1 = targetCenterX - drawW1 / 2 + tiltX / cellSize;
          const drawY1 = targetCenterY - drawH1 / 2 + tiltY / cellSize;
          offCtx.drawImage(imgPose1, drawX1, drawY1, drawW1, drawH1);
          offCtx.restore();
        }
      }

      // Disintegration Dynamics:
      // As the celestial spark lifts off, Marcus Aurelius disintegrates from his pointing hand
      // down across his robes into floating stardust (storyProg: 0.02 -> 0.36)
      let disintegrateProg = 0;
      let statueFade = 1;
      if (storyProg > 0.02) {
        disintegrateProg = Math.min(1, Math.max(0, (storyProg - 0.02) / 0.34));
        statueFade = Math.max(0, 1 - disintegrateProg * 1.02);
      }

      // 2. Draw Standing Classical Marcus Aurelius Statue (imgPose2)
      if (pose2Ready && p2Alpha > 0.01 && statueFade > 0.005) {
        offCtx.save();
        offCtx.globalAlpha = p2Alpha * Math.min(1, statueFade * 1.4);
        const img2Aspect = imgPose2.width / imgPose2.height;
        let drawH2 = rows * 0.96;
        let drawW2 = drawH2 * img2Aspect;
        if (drawW2 > cols * 0.55 && !isMobile) {
          drawW2 = cols * 0.55;
          drawH2 = drawW2 / img2Aspect;
        }
        currentDrawW = drawW2;
        currentDrawH = drawH2;

        const drawX2 = targetCenterX - drawW2 / 2 + tiltX / cellSize;
        const drawY2 = targetCenterY - drawH2 / 2 + tiltY / cellSize;
        offCtx.drawImage(imgPose2, drawX2, drawY2, drawW2, drawH2);
        offCtx.restore();

        // Cellular Disintegration on Marcus Aurelius:
        // Confined strictly to Marcus's bounding box BEFORE the Angel is drawn.
        // The Angel is drawn subsequently at center and remains 100% full and symmetrical!
        if (disintegrateProg > 0.005) {
          const startX = Math.max(0, Math.floor(drawX2));
          const startY = Math.max(0, Math.floor(drawY2));
          const boxW = Math.min(cols - startX, Math.ceil(drawW2));
          const boxH = Math.min(rows - startY, Math.ceil(drawH2));

          if (boxW > 0 && boxH > 0) {
            const mData = offCtx.getImageData(startX, startY, boxW, boxH);
            const d = mData.data;

            for (let py = 0; py < boxH; py++) {
              const gy = startY + py;
              const normY = (gy - drawY2) / drawH2;

              for (let px = 0; px < boxW; px++) {
                const gx = startX + px;
                const pIdx = (py * boxW + px) * 4;
                const curA = d[pIdx + 3];
                if (curA === 0) continue;

                const normX = (gx - drawX2) / drawW2;
                // Wave sweeps diagonally from pointing hand (top-left) to pedestal (bottom-right)
                const wave = normX * 0.40 + normY * 0.60;
                // Deterministic high-frequency noise
                const hash = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
                const noise = hash - Math.floor(hash);
                const threshold = wave * 0.58 + noise * 0.42;

                if (disintegrateProg > threshold) {
                  const burnT = (disintegrateProg - threshold) / 0.18;
                  if (burnT >= 1.0) {
                    d[pIdx + 3] = 0;
                  } else {
                    d[pIdx + 3] = Math.floor(curA * (1 - burnT));
                  }
                }
              }
            }
            offCtx.putImageData(mData, startX, startY);
          }
        }
      }

      // Fallback sculpture dimensions when statue dissolves in Section 3
      if (currentDrawW === 0) {
        currentDrawW = cols * 0.45;
        currentDrawH = rows * 0.90;
      }

      // Outstretched pointing index fingertip (calibrated to exact pixel ratio of stoic_pose3.jpg: x=0.2158, y=0.2139):
      const fingerOriginX = targetCenterX - currentDrawW * 0.2842 + tiltX / cellSize;
      const fingerOriginY = targetCenterY - currentDrawH * 0.2861 + tiltY / cellSize;
      const leftDestX = cols * 0.50;
      const leftDestY = rows * 0.48;

      // Angel Alpha: As the canvas inverts to celestial dawn, the classical Angel materializes at center (0.08 -> 0.35)
      let angelAlpha = 0;
      if (storyProg > 0.08) {
        const aT = Math.min(1, (storyProg - 0.08) / 0.27);
        angelAlpha = aT * aT * (3 - 2 * aT);
      }

      // Track flying entity bounds for flawless pearl lock-in
      let currentEntityX = 0;
      let currentEntityY = 0;
      let currentEntityW = 0;
      let currentEntityH = 0;

      // 3b. Draw Majestic Classical Angel in Center of Viewport (emerges from celestial beam of light)
      if (angelAlpha > 0.01 && imgAngel.complete && imgAngel.naturalWidth > 0) {
        // Serene, dignified breathing levitation
        const floatY = Math.sin(time * 0.7) * 0.7;
        const entityCenterX = leftDestX;
        const entityCenterY = leftDestY + floatY;

        // Scale: expands smoothly into full majestic sculpture (~0.84 rows)
        const scaleProg = Math.min(1, Math.max(0, (storyProg - 0.08) / 0.36));
        const smoothScale = scaleProg * scaleProg * (3 - 2 * scaleProg);
        const entityH = isMobile ? rows * (0.64 + smoothScale * 0.18) : rows * (0.72 + smoothScale * 0.16);
        const angelAspect = imgAngel.width / imgAngel.height;
        const entityW = entityH * angelAspect;

        currentEntityX = entityCenterX;
        currentEntityY = entityCenterY;
        currentEntityW = entityW;
        currentEntityH = entityH;

        offCtx.save();
        offCtx.globalAlpha = angelAlpha;
        const ex = entityCenterX - entityW / 2;
        const ey = entityCenterY - entityH / 2;
        offCtx.drawImage(imgAngel, ex, ey, entityW, entityH);
        offCtx.restore();
      }

      ctx.save();
      if (canvasShakeX !== 0 || canvasShakeY !== 0) {
        ctx.translate(canvasShakeX, canvasShakeY);
      }

      // Apply dimensional camera zoom centered on the radiant celestial core
      const focalX = orbPosRef.current.initialized ? orbPosRef.current.x : width * 0.5;
      const focalY = orbPosRef.current.initialized ? orbPosRef.current.y : height * 0.48;

      if (currentZoom > 1.001) {
        // Perspective Lateral Shift: Glide angel gracefully to right wing on desktop to create clean space for line-art cutout
        const zoomProg = Math.min(1, Math.max(0, (currentZoom - 1.0) / 1.2));
        const panX = isMobile ? 0 : zoomProg * (width * 0.18);
        const panY = isMobile ? -zoomProg * (height * 0.12) : 0;

        ctx.translate(panX, panY);
        ctx.translate(focalX, focalY);
        ctx.scale(currentZoom, currentZoom);
        ctx.translate(-focalX, -focalY);
      }

      // Celestial Dawn Aura (magnificent radiant glow centered on the Angel, preserving luxurious obsidian base)
      if (dawnAura > 0.01) {
        const auraGrad = ctx.createRadialGradient(
          focalX,
          focalY,
          10,
          focalX,
          focalY,
          Math.max(width, height) * 0.58
        );
        // Soft royal violet and luminous alabaster dawn halo
        auraGrad.addColorStop(0, `rgba(168, 85, 247, ${0.16 * dawnAura})`);
        auraGrad.addColorStop(0.32, `rgba(109, 40, 217, ${0.10 * dawnAura})`);
        auraGrad.addColorStop(0.68, `rgba(46, 16, 101, ${0.05 * dawnAura})`);
        auraGrad.addColorStop(1, "rgba(7, 6, 11, 0)");
        ctx.fillStyle = auraGrad;
        // Expanded bounds guarantee full viewport coverage regardless of scale factor
        ctx.fillRect(-width * 4, -height * 4, width * 9, height * 9);
      }

      // Dimensional Perspective Convergence Rays (subtle architectural grid lines streaming into the core)
      if (currentZoom > 1.05) {
        const warpAlpha = Math.min(0.20, (currentZoom - 1.0) * 0.12);
        ctx.save();
        ctx.strokeStyle = `rgba(216, 180, 254, ${warpAlpha})`;
        ctx.lineWidth = 1.0;
        ctx.setLineDash([4, 10]);
        const rayLen = Math.max(width, height) * 2;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          ctx.beginPath();
          ctx.moveTo(focalX, focalY);
          ctx.lineTo(focalX + Math.cos(a + time * 0.05) * rayLen, focalY + Math.sin(a + time * 0.05) * rayLen);
          ctx.stroke();
        }
        ctx.restore();
      }

      const imgData = offCtx.getImageData(0, 0, cols, rows);
      const data = imgData.data;

      ctx.font = `700 ${cellSize - 1}px var(--font-geist-mono), monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Invert camera transforms to map cursor directly into local canvas space
      let localMouseX = mouseRef.current.pixelX;
      let localMouseY = mouseRef.current.pixelY;

      localMouseX -= canvasShakeX;
      localMouseY -= canvasShakeY;

      if (currentZoom > 1.001) {
        const zoomProg = Math.min(1, Math.max(0, (currentZoom - 1.0) / 1.2));
        const panX = isMobile ? 0 : zoomProg * (width * 0.18);
        const panY = isMobile ? -zoomProg * (height * 0.12) : 0;

        localMouseX = (localMouseX - panX - focalX) / currentZoom + focalX;
        localMouseY = (localMouseY - panY - focalY) / currentZoom + focalY;
      }

      // Pre-map active ripples into local coordinate space
      const hasRipples = ripplesRef.current.length > 0;
      const localRipples = hasRipples
        ? ripplesRef.current.map((rip) => {
            let rx = rip.x - canvasShakeX;
            let ry = rip.y - canvasShakeY;
            if (currentZoom > 1.001) {
              const zoomProg = Math.min(1, Math.max(0, (currentZoom - 1.0) / 1.2));
              const panX = isMobile ? 0 : zoomProg * (width * 0.18);
              const panY = isMobile ? -zoomProg * (height * 0.12) : 0;
              rx = (rx - panX - focalX) / currentZoom + focalX;
              ry = (ry - panY - focalY) / currentZoom + focalY;
            }
            return {
              x: rx,
              y: ry,
              radius: rip.radius / (currentZoom || 1),
              strength: rip.strength,
            };
          })
        : [];

      // Pure Luminous Ethereal ASCII Tokens: radiant constellations against luxurious obsidian
      const cWhite = COLOR_WHITE;
      const cBloomWhite = COLOR_BLOOM_WHITE;
      const cLavender = COLOR_LAVENDER;
      const cViolet = COLOR_VIOLET;
      const cDeepViolet = COLOR_DEEP_VIOLET;
      const cBgDither = COLOR_BG_DITHER;

      // High-performance clean rasterization: LUT, chroma-keying, zero-allocation styling
      let curFillStyle = "";

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = (y * cols + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          const screenX = x * cellSize + cellSize / 2;
          const screenY = y * cellSize + cellSize / 2;

          // 1. CHROMA/LUMA KEYING: Clean removal of rectangular boxes, haze, and JPEG shadow artifacts
          const isBg = a < 25 || (r < 38 && g < 38 && b < 38);

          if (isBg) {
            const bayerIdx = (x & 3) + (y & 3) * 4;
            if (bayerIdx === 0 || bayerIdx === 10) {
              const mdx = screenX - localMouseX;
              const mdy = screenY - localMouseY;
              const distSq = mdx * mdx + mdy * mdy;

              if (distSq < 48400) {
                // Within 220px of mouse: dynamic aura
                const mdist = Math.sqrt(distSq);
                const mouseGlow = 1 - mdist / 220;
                const ditherColor = `rgba(139, 92, 246, ${0.04 + mouseGlow * 0.28})`;
                if (curFillStyle !== ditherColor) {
                  ctx.fillStyle = ditherColor;
                  curFillStyle = ditherColor;
                }
                ctx.fillRect(screenX - 0.75, screenY - 0.75, 1.5, 1.5);
              } else {
                if (curFillStyle !== cBgDither) {
                  ctx.fillStyle = cBgDither;
                  curFillStyle = cBgDither;
                }
                ctx.fillRect(screenX - 0.75, screenY - 0.75, 1.5, 1.5);
              }
            }
            continue;
          }

          // 2. STATUE CELLS (Foreground Sculptural Processing)
          const lumInt = (0.299 * r + 0.587 * g + 0.114 * b) | 0;
          const adjustedLum = LUM_LUT[lumInt];
          if (adjustedLum < 0.06) continue;

          // Shockwave Ripples: Bounding box precheck avoids expensive sqrt
          let rippleOffset = 0;
          if (hasRipples) {
            for (let i = 0; i < localRipples.length; i++) {
              const rip = localRipples[i];
              const rdx = screenX - rip.x;
              const rdy = screenY - rip.y;
              const maxR = rip.radius + 35;
              if (Math.abs(rdx) < maxR && Math.abs(rdy) < maxR) {
                const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
                const waveDist = Math.abs(rdist - rip.radius);
                if (waveDist < 35) {
                  rippleOffset += Math.sin((waveDist / 35) * Math.PI) * rip.strength;
                }
              }
            }
          }

          let drawX = screenX;
          let drawY = screenY;

          // Mouse proximity hover bloom & subtle push (vector math avoids atan2/cos/sin)
          const mdx = screenX - localMouseX;
          const mdy = screenY - localMouseY;
          const distSq = mdx * mdx + mdy * mdy;
          let hoverBloom = 0;
          if (distSq < 19600) {
            const mdist = Math.sqrt(distSq);
            hoverBloom = 1 - mdist / 140;
            const invDist = 1 / (mdist || 1);
            drawX += mdx * invDist * hoverBloom * 4;
            drawY += mdy * invDist * hoverBloom * 4;
          }

          if (rippleOffset !== 0) {
            drawX += (Math.random() - 0.5) * rippleOffset * 8;
            drawY += (Math.random() - 0.5) * rippleOffset * 8;
          }

          // Bayer ordered dither on subject
          const bayer = (((x & 3) + (y & 3) * 4) * 0.0625 - 0.5) * 0.08;
          const finalLum = Math.min(Math.max(adjustedLum + bayer + hoverBloom * 0.22, 0), 1);

          let char = ASCII_CHARS[(finalLum * (ASCII_CHARS.length - 1)) | 0];

          // Invert-aware static color state machine for central character
          let targetColor = cDeepViolet;
          if (finalLum > 0.82 || hoverBloom > 0.6) {
            targetColor = hoverBloom > 0.6 ? cBloomWhite : cWhite;
          } else if (finalLum > 0.58) {
            targetColor = cLavender;
          } else if (finalLum > 0.32) {
            targetColor = cViolet;
          }


          if (curFillStyle !== targetColor) {
            ctx.fillStyle = targetColor;
            curFillStyle = targetColor;
          }

          ctx.fillText(char, drawX, drawY);
        }
      }

      // Ambient Floating ASCII Stardust: Fills the negative space with living, resonant digital embers
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const p of PARTICLES) {
        p.y -= p.speedY;
        p.x += p.speedX + Math.sin(time + p.seed) * 0.0003;

        // Horizontal velocity streaming: as camera travels left, stardust streams right
        if (storyProg > 0.02) {
          p.x += storyProg * 0.0035;
        } else if (horizontalRatio > 0.58) {
          p.x -= 0.00015;
        }

        if (p.y < -0.05) {
          p.y = 1.05;
          p.x = Math.random();
        }
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        let px = p.x * width;
        let py = p.y * height;

        const pdx = px - localMouseX;
        const pdy = py - localMouseY;
        const pdistSq = pdx * pdx + pdy * pdy;
        let pMouseGlow = 0;
        if (pdistSq < 25600) {
          const pdist = Math.sqrt(pdistSq);
          pMouseGlow = 1 - pdist / 160;
          px += (pdx / pdist) * pMouseGlow * 12;
          py += (pdy / pdist) * pMouseGlow * 12;
        }

        const alpha = Math.min(1, p.baseAlpha + pMouseGlow * 0.5 + Math.sin(time * 2 + p.seed) * 0.08);
        ctx.font = `600 ${p.size}px var(--font-geist-mono), monospace`;

        if (pMouseGlow > 0.35) {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`;
        }
        ctx.fillText(p.char, px, py);
      }

      // Subtle atmospheric ASCII architectural crosshairs on the left during transition
      if (horizontalRatio > 0.58) {
        const crosshairAlpha = Math.min(0.22, (horizontalRatio - 0.58) * 1.1);
        ctx.font = `500 11px var(--font-geist-mono), monospace`;
        ctx.fillStyle = `rgba(168, 85, 247, ${crosshairAlpha})`;
        ctx.fillText("+", width * 0.12, height * 0.22);
        ctx.fillText("+", width * 0.45, height * 0.22);
        ctx.fillText("+", width * 0.12, height * 0.78);
        ctx.fillText("+", width * 0.45, height * 0.78);
      }

      ctx.restore();

      // 4. Draw Radiant Celestial Starlight & Guiding Thread
      if (isWormholeActive || storyProg > 0 || heroProgress > 0.45) {
        // Anatomical Landmarks for Marcus Aurelius (pure classical marble statue):
        const statueFeetX = targetCenterX + currentDrawW * 0.048 + tiltX / cellSize;
        const statueFeetY = targetCenterY + currentDrawH * 0.380 + tiltY / cellSize;

        const statueFaceX = targetCenterX + currentDrawW * 0.008 + tiltX / cellSize;
        const statueFaceY = targetCenterY - currentDrawH * 0.383 + tiltY / cellSize;

        let ptX = statueFeetX;
        let ptY = statueFeetY;
        let orbAlpha = 1.0;

        if (heroProgress > 0.40 && storyProg <= 0) {
          orbAlpha = Math.min(1, Math.max(0, (heroProgress - 0.40) / 0.30));
        }

        // Dissolve starlight completely when zoomed into feature reading view to keep focus pure & minimal
        if (currentZoom > 1.05) {
          const zoomFade = Math.max(0, 1 - (currentZoom - 1.05) / 0.25);
          orbAlpha *= zoomFade;
        }

        if (storyProg <= 0) {
          // --- HERO STAGE: ASCENT TO POINTING FINGERTIP ---
          if (heroProgress < 0.65) {
            const riseT = Math.min(1, Math.max(0, heroProgress / 0.65));
            const smoothRise = riseT * riseT * (3 - 2 * riseT);
            ptX = statueFeetX + (statueFaceX - statueFeetX) * smoothRise;
            ptY = statueFeetY + (statueFaceY - statueFeetY) * smoothRise;
          } else {
            // Glides along the outstretched arm directly to the fingertip as the statue points
            const armT = Math.min(1, Math.max(0, (heroProgress - 0.65) / 0.30));
            const smoothArm = armT * armT * (3 - 2 * armT);
            ptX = statueFaceX + (fingerOriginX - statueFaceX) * smoothArm;
            ptY = statueFaceY + (fingerOriginY - statueFaceY) * smoothArm;
          }
        } else {
          // --- CELESTIAL GUIDING ARC TO CENTER ANGEL SCULPTURE ---
          // Lifts off gracefully from the pointing fingertip, drawing a serene arc to the Angel
          const p0 = { x: fingerOriginX, y: fingerOriginY };
          const p1 = { x: p0.x - cols * 0.16, y: p0.y - rows * 0.10 }; // gentle upward cosmic arc
          const p2 = { x: cols * 0.42, y: rows * 0.36 }; // swooping smoothly toward center
          const p3 = { x: leftDestX, y: leftDestY - rows * 0.04 }; // settling into the Angel's chest

          const flightProg = Math.min(1, storyProg / 0.28);
          const flightPt = evalCubicBezier(flightProg, p0, p1, p2, p3);
          ptX = flightPt.x;
          ptY = flightPt.y;

          // Delicate celestial thread trailing behind the guiding spark (subtle hairline, not a laser)
          if (flightProg > 0.03 && flightProg < 0.98) {
            const threadFade = Math.sin(flightProg * Math.PI) * 0.55;
            ctx.save();
            ctx.strokeStyle = `rgba(233, 213, 255, ${threadFade * 0.8})`;
            ctx.lineWidth = 0.75;
            ctx.setLineDash([3, 5]);
            ctx.beginPath();
            ctx.moveTo(p0.x * cellSize, p0.y * cellSize);
            const numSegments = 16;
            for (let i = 1; i <= numSegments; i++) {
              const segT = (i / numSegments) * flightProg;
              const segPt = evalCubicBezier(segT, p0, p1, p2, p3);
              ctx.lineTo(segPt.x * cellSize, segPt.y * cellSize);
            }
            ctx.stroke();
            ctx.restore();
          }
        }

        // Only apply gentle floating hover when hovering in mid-air (wormhole/angel), keeping it firmly locked to Marcus's finger during hero
        const pointHoverY = storyProg > 0 ? Math.sin(time * 0.7) * 0.7 * cellSize : 0;
        const targetSpiritX = ptX * cellSize;
        const targetSpiritY = ptY * cellSize + pointHoverY;

        // Critically damped 60-120fps lerp eliminates mousewheel notched step stutter
        if (!orbPosRef.current.initialized) {
          orbPosRef.current.x = targetSpiritX;
          orbPosRef.current.y = targetSpiritY;
          orbPosRef.current.initialized = true;
        } else {
          orbPosRef.current.x += (targetSpiritX - orbPosRef.current.x) * 0.22;
          orbPosRef.current.y += (targetSpiritY - orbPosRef.current.y) * 0.22;
        }

        const spiritX = orbPosRef.current.x;
        const spiritY = orbPosRef.current.y;

        ctx.save();
        ctx.globalAlpha = orbAlpha;

        // Minimal Stoic Celestial Starlight (replaces distracting arcade HUD reticle)
        if (orbAlpha > 0.01) {
          const flareLen = 5.0 + Math.sin(time * 1.8) * 1.2;

          // 1. Subtle 4-Point Cardinal Starlight Flare (Hairline 0.75px)
          ctx.strokeStyle = "rgba(233, 213, 255, 0.65)";
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          // Horizontal flare
          ctx.moveTo(spiritX - flareLen, spiritY);
          ctx.lineTo(spiritX + flareLen, spiritY);
          // Vertical flare
          ctx.moveTo(spiritX, spiritY - flareLen);
          ctx.lineTo(spiritX, spiritY + flareLen);
          ctx.stroke();

          // 2. Refined Starlight Pearl (2.2px pure luminous core with soft ambient haze)
          ctx.beginPath();
          ctx.arc(spiritX, spiritY, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(216, 180, 254, 0.75)";
          ctx.shadowBlur = 5;
          ctx.fill();
        }

        ctx.restore();

        // Broadcast active orb screen position for interactive HUD targeting
        if (typeof window !== "undefined") {
          (window as any).__stoicOrbPos = {
            x: spiritX,
            y: spiritY,
            scale: currentZoom,
            alpha: orbAlpha,
            isInverted: false,
          };
        }
      }

      // Restore camera shake and dimensional zoom transform
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    const handlePointerMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
      mouseRef.current.pixelX = e.clientX;
      mouseRef.current.pixelY = e.clientY;

      if (Math.random() > 0.8) {
        ripplesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          radius: 4,
          maxRadius: 100,
          strength: 1.0,
        });
      }
    };

    const handlePointerLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      mouseRef.current.pixelX = -1000;
      mouseRef.current.pixelY = -1000;
    };

    const handleClick = (e: MouseEvent) => {
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 260,
        strength: 2.4,
      });
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("click", handleClick);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("stoic-zoom", handleZoomEvent);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (canvasRef.current) {
        canvasRef.current.style.filter = "none";
        canvasRef.current.style.transform = "none";
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-10 pointer-events-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
