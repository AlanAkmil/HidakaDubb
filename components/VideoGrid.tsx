"use client";

import { useMemo, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import VideoCard from "./VideoCard";
import Waveform from "./Waveform";
import type { Video } from "@/lib/scraper";

const CATEGORY_TABS = ["Anime Series", "Anime Movie", "Film Movie", "TV Series", "Shorts"];

export default function VideoGrid({ videos }: { videos: Video[] }) {
  const [active, setActive] = useState<string>("Semua");
  const tabs = ["Semua", ...CATEGORY_TABS];

  const shown = useMemo(() => {
    if (active === "Semua") return videos;
    // category isn't always reliably parsed from card blocks, so we also
    // fall back to matching it loosely against the title text.
    return videos.filter(
      (v) =>
        v.category === active ||
        v.title.toLowerCase().includes(active.toLowerCase().split(" ")[0])
    );
  }, [active, videos]);

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

      {videos.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-studio-panel py-16 text-center">
          <p className="text-studio-muted">
            Gagal ambil data dari sumber (situs mungkin lagi block request server, atau struktur
            berubah). Cek <code className="text-studio-amber">/api/scrape?type=home</code> buat
            lihat respons mentahnya.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-studio-panel py-16 text-center">
          <p className="text-studio-muted">Belum ada judul di kategori ini di halaman ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-9">
          {shown.map((v, i) => (
            <VideoCard key={v.path} video={v} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
