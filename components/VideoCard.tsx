"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Waveform from "./Waveform";
import type { Video } from "@/lib/scraper";

export default function VideoCard({ video, index }: { video: Video; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={`/watch/${encodeURIComponent(video.path)}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group block"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-studio-panel">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="h-full w-full bg-studio-panel2" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-studio-bg/90 via-studio-bg/0 to-studio-bg/0" />

        {video.duration && (
          <div className="absolute bottom-2 right-2 rounded-md bg-studio-bg/80 px-1.5 py-0.5 font-mono text-[11px] text-studio-paper">
            {video.duration}
          </div>
        )}

        <div className="absolute bottom-2 left-2 flex h-5 items-end">
          <Waveform bars={12} active={hovered} className="h-4 w-9" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="font-display font-medium text-[15px] leading-snug text-studio-paper line-clamp-2 group-hover:text-studio-rec transition-colors">
          {video.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-studio-muted">
          {video.views && <span>{video.views} ditonton</span>}
          {video.views && video.uploaded && <span>·</span>}
          {video.uploaded && <span>{video.uploaded}</span>}
        </div>
      </div>
    </motion.a>
  );
}
