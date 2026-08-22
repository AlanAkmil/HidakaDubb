"use client";

import { useMemo } from "react";

type WaveformProps = {
  bars?: number;
  active?: boolean; // if false, bars sit flat (e.g. paused / idle state)
  className?: string;
  color?: string;
};

/**
 * The site's signature motif: a row of bars that behave like a voice
 * waveform. Cheap to animate (CSS transform only), reused as a section
 * divider, a hover indicator on cards, and a "now playing" cue.
 */
export default function Waveform({
  bars = 40,
  active = true,
  className = "",
  color = "#FF5A3C",
}: WaveformProps) {
  // stable pseudo-random heights + delays so it doesn't look mechanically uniform
  const barConfigs = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const seed = Math.sin(i * 12.9898) * 43758.5453;
        const frac = seed - Math.floor(seed);
        return {
          delay: (frac * 1.6).toFixed(2),
          duration: (0.9 + frac * 0.8).toFixed(2),
          baseHeight: 20 + frac * 60,
        };
      }),
    [bars]
  );

  return (
    <div
      className={`flex items-end gap-[3px] ${className}`}
      aria-hidden="true"
    >
      {barConfigs.map((cfg, i) => (
        <span
          key={i}
          className={active ? "animate-waveform" : ""}
          style={{
            display: "inline-block",
            width: "3px",
            height: `${cfg.baseHeight}%`,
            minHeight: "10%",
            background: color,
            borderRadius: "2px",
            transformOrigin: "bottom",
            animationDelay: `${cfg.delay}s`,
            animationDuration: `${cfg.duration}s`,
            opacity: active ? 0.9 : 0.25,
            transition: "opacity 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}
