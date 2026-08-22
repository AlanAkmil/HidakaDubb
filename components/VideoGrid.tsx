"use client";

import { useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import VideoCard from "./VideoCard";
import Waveform from "./Waveform";
import { videos, categories } from "@/lib/data";

export default function VideoGrid() {
  const [active, setActive] = useState<string>("Semua");
  const tabs = ["Semua", ...categories];

  const shown = active === "Semua" ? videos : videos.filter((v) => v.category === active);

  return (
    <section id="jelajah" className="mx-auto max-w-7xl px-5 md:px-8 py-16 md:py-20">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <div className="font-mono text-xs tracking-[0.25em] text-studio-amber mb-2">
            RUANG PUTAR
          </div>
          <h2 className="font-display font-bold text-3xl md:text-4xl">Lagi ramai ditonton</h2>
        </div>
        <Waveform bars={16} className="hidden md:flex h-9 w-24" color="#F4B942" />
      </div>

      <LayoutGroup>
        <div className="flex flex-wrap gap-2 mb-10 font-mono text-[13px]">
          {tabs.map((tab) => {
            const isActive = tab === active;
            return (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`relative rounded-full px-4 py-2 transition-colors ${
                  isActive ? "text-studio-bg" : "text-studio-muted hover:text-studio-paper"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-studio-paper"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{tab}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-studio-panel py-16 text-center">
          <p className="text-studio-muted">
            Belum ada judul di kategori ini. Coba kategori lain dulu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-9">
          {shown.map((v, i) => (
            <VideoCard key={v.slug} video={v} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
