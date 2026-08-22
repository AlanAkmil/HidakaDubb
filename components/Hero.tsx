"use client";

import { motion } from "framer-motion";
import Waveform from "./Waveform";

const tags = [
  "ANIME", "FILM", "SERIES", "SULIH SUARA ID", "TANPA IKLAN BERISIK", "SHORTS",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      {/* ambient glow — single soft radial, cheap on perf, no blur filters over large area */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(closest-side, #FF5A3C, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8 pt-20 pb-14 md:pt-28 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono text-xs tracking-[0.25em] text-studio-rec mb-5 flex items-center gap-2"
        >
          <span>● ON AIR</span>
          <span className="text-studio-muted">— studio dubbing, buka 24 jam</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold leading-[0.95] text-[13vw] md:text-[6.2vw] lg:text-[88px] tracking-tight max-w-4xl"
        >
          Suara baru untuk
          <br />
          cerita yang <span className="text-studio-rec">kamu suka.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-lg text-studio-muted text-base md:text-lg"
        >
          Anime, film, dan series dengan sulih suara Bahasa Indonesia —
          dipilih dan diperiksa manual, bukan asal comot.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-9 flex items-center gap-5"
        >
          <a
            href="#jelajah"
            className="rounded-full bg-studio-rec px-6 py-3 font-medium text-studio-bg transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Mulai nonton
          </a>
          <div className="hidden sm:block">
            <Waveform bars={22} className="h-8 w-32" />
          </div>
        </motion.div>
      </div>

      {/* marquee ticker — texture, not decoration: signals what's on the shelf */}
      <div className="relative border-t border-white/5 bg-studio-panel/60">
        <div className="flex overflow-hidden no-scrollbar py-3">
          <div className="flex shrink-0 animate-marquee gap-10 font-mono text-xs tracking-[0.2em] text-studio-muted whitespace-nowrap">
            {[...tags, ...tags].map((t, i) => (
              <span key={i} className="flex items-center gap-10">
                {t}
                <span className="text-studio-rec">/</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
