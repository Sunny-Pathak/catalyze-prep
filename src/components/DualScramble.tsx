"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface DualScrambleProps {
  text: string;
  className?: string;
  scrambleOnMount?: boolean;
  speed?: number;
  chars?: string;
  accentText?: string;
  trigger?: boolean | number | string;
}

const DEFAULT_CHARS = "01$#%&/()=?*+~^<>{}[]ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function DualScramble({
  text,
  className = "",
  scrambleOnMount = true,
  speed = 35,
  chars = DEFAULT_CHARS,
  accentText,
  trigger,
}: DualScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScramble = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let iteration = 0;
    const maxIterations = text.length;

    intervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= maxIterations) {
        clearInterval(intervalRef.current!);
        setDisplayText(text);
      }

      iteration += 1 / 2;
    }, speed);
  }, [text, chars, speed]);

  useEffect(() => {
    if (scrambleOnMount) {
      const timer = setTimeout(() => {
        startScramble();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [scrambleOnMount, startScramble]);

  useEffect(() => {
    if (trigger !== undefined && trigger !== false) {
      const timer = setTimeout(() => {
        startScramble();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [trigger, startScramble]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <span
      onMouseEnter={startScramble}
      className={`inline-block cursor-pointer select-none transition-colors duration-200 ${className}`}
      title="Hover to scramble"
    >
      {displayText}
      {accentText && (
        <span className="text-violet-400 font-normal italic ml-2">
          {accentText}
        </span>
      )}
    </span>
  );
}
