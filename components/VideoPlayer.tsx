"use client";

import { useState } from "react";
import type { VideoSource } from "@/lib/scraper";

export default function VideoPlayer({
  embedUrl,
  videoSources,
  thumbnail,
  watchPath,
}: {
  embedUrl: string | null;
  videoSources: VideoSource[];
  thumbnail: string | null;
  watchPath: string;
}) {
  // Multiple real qualities were found on the source page -> let the user
  // pick one and play it directly with <video>, which is the only way to
  // actually offer a resolution switcher (an <iframe> embed hides that
  // control inside whatever player the source site uses).
  const hasMultipleQualities = videoSources.length > 1;
  const [useDirect, setUseDirect] = useState(hasMultipleQualities);
  const [quality, setQuality] = useState(videoSources[0]?.label ?? "");

  const activeSrc = videoSources.find((s) => s.label === quality)?.url || videoSources[0]?.url;

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-studio-panel">
        {useDirect && activeSrc ? (
          <video
            key={activeSrc}
            src={activeSrc}
            poster={thumbnail || undefined}
            controls
            autoPlay
            className="h-full w-full object-contain bg-black"
          />
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            className="h-full w-full"
            frameBorder={0}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : activeSrc ? (
          <video
            src={activeSrc}
            poster={thumbnail || undefined}
            controls
            className="h-full w-full object-contain bg-black"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-studio-muted text-sm px-4 text-center">
            Video source gak ketemu di halaman ini — cek{" "}
            <code className="text-studio-amber mx-1">
              /api/scrape?type=watch&path={encodeURIComponent(watchPath)}
            </code>
          </div>
        )}
      </div>

      {hasMultipleQualities && (
        <div className="mt-3 flex items-center gap-2 font-mono text-[12px] text-studio-muted">
          <span>Kualitas:</span>
          {videoSources.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                setQuality(s.label);
                setUseDirect(true);
              }}
              className={`rounded-full px-3 py-1 transition-colors ${
                useDirect && quality === s.label
                  ? "bg-studio-rec text-studio-bg"
                  : "bg-studio-panel text-studio-muted hover:text-studio-paper"
              }`}
            >
              {s.label}
            </button>
          ))}
          {embedUrl && (
            <button
              onClick={() => setUseDirect(false)}
              className={`rounded-full px-3 py-1 transition-colors ${
                !useDirect
                  ? "bg-studio-rec text-studio-bg"
                  : "bg-studio-panel text-studio-muted hover:text-studio-paper"
              }`}
            >
              embed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
