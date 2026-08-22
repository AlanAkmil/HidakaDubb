import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Waveform from "@/components/Waveform";
import { getWatchDetail } from "@/lib/scraper";

export const revalidate = 300;

export default async function WatchPage({ params }: { params: { slug: string[] } }) {
  const watchPath = params.slug.join("/");

  let detail;
  try {
    detail = await getWatchDetail(watchPath);
  } catch {
    notFound();
  }
  if (!detail) notFound();

  return (
    <main>
      <Navbar />

      <div className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-20">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-studio-panel">
          {detail.videoSrc ? (
            <video
              src={detail.videoSrc}
              poster={detail.thumbnail || undefined}
              controls
              className="h-full w-full object-contain bg-black"
            />
          ) : detail.embedUrl ? (
            <iframe
              src={detail.embedUrl}
              className="h-full w-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-studio-muted text-sm">
              Video source gak ketemu di halaman ini — cek{" "}
              <code className="text-studio-amber mx-1">
                /api/scrape?type=watch&path={encodeURIComponent(watchPath)}
              </code>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Waveform bars={26} className="h-6 w-40" />
          {detail.duration && (
            <span className="font-mono text-xs text-studio-muted">{detail.duration}</span>
          )}
        </div>

        <h1 className="mt-4 font-display font-bold text-2xl md:text-4xl leading-tight max-w-3xl">
          {detail.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[12px] text-studio-muted">
          {detail.category && (
            <span className="rounded-full bg-studio-panel px-3 py-1 text-studio-amber">
              {detail.category}
            </span>
          )}
          {detail.views && <span>{detail.views} ditonton</span>}
          {detail.uploadDate && (
            <>
              <span>·</span>
              <span>{detail.uploadDate}</span>
            </>
          )}
          {detail.uploader && (
            <>
              <span>·</span>
              <a href={detail.uploaderUrl || "#"} className="hover:text-studio-paper">
                {detail.uploader}
              </a>
            </>
          )}
        </div>

        {detail.synopsis && (
          <p className="mt-6 max-w-2xl text-studio-muted leading-relaxed">{detail.synopsis}</p>
        )}

        {detail.downloadLink && (
          <a
            href={detail.downloadLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-studio-rec px-6 py-3 font-medium text-studio-bg hover:scale-[1.03] transition-transform"
          >
            Download
          </a>
        )}
      </div>

      <Footer />
    </main>
  );
}
