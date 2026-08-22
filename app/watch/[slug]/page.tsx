import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoCard from "@/components/VideoCard";
import Waveform from "@/components/Waveform";
import { getBySlug, videos } from "@/lib/data";

export default function WatchPage({ params }: { params: { slug: string } }) {
  const video = getBySlug(params.slug);
  if (!video) notFound();

  const related = videos.filter((v) => v.slug !== video.slug).slice(0, 4);

  return (
    <main>
      <Navbar />

      <div className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-20">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-studio-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-studio-bg/40">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-studio-rec/95">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#14111F">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Waveform bars={26} className="h-6 w-40" />
          <span className="font-mono text-xs text-studio-muted">{video.duration}</span>
        </div>

        <h1 className="mt-4 font-display font-bold text-2xl md:text-4xl leading-tight max-w-3xl">
          {video.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[12px] text-studio-muted">
          <span className="rounded-full bg-studio-panel px-3 py-1 text-studio-amber">
            {video.category}
          </span>
          <span>{video.views} ditonton</span>
          <span>·</span>
          <span>{video.uploaded}</span>
        </div>

        <p className="mt-6 max-w-2xl text-studio-muted leading-relaxed">
          {video.synopsis}
        </p>

        <div className="mt-16">
          <h2 className="font-display font-bold text-xl mb-6">Judul terkait</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-9">
            {related.map((v, i) => (
              <VideoCard key={v.slug} video={v} index={i} />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export function generateStaticParams() {
  return videos.map((v) => ({ slug: v.slug }));
}
