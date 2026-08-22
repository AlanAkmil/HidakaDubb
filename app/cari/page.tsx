import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoCard from "@/components/VideoCard";
import { search } from "@/lib/scraper";

export const revalidate = 0;

export default async function CariPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() || "";

  let results: Awaited<ReturnType<typeof search>>["results"] = [];
  if (q) {
    try {
      const res = await search(q);
      results = res.results;
    } catch {
      results = [];
    }
  }

  return (
    <main>
      <Navbar />
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-16">
        <div className="font-mono text-xs tracking-[0.25em] text-studio-amber mb-2">
          HASIL PENCARIAN
        </div>
        <h1 className="font-display font-bold text-2xl md:text-4xl mb-8">
          {q ? `"${q}"` : "Ketik sesuatu di kolom cari"}
        </h1>

        {q && results.length === 0 && (
          <div className="rounded-xl border border-white/5 bg-studio-panel py-16 text-center">
            <p className="text-studio-muted">
              Gak ketemu judul buat &quot;{q}&quot;. Coba kata kunci lain.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-9">
            {results.map((v, i) => (
              <VideoCard key={v.path} video={v} index={i} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
