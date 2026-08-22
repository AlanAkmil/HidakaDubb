import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import VideoGrid from "@/components/VideoGrid";
import Footer from "@/components/Footer";
import { getHome } from "@/lib/scraper";

// Re-scrape at most every 5 minutes instead of on every single request.
export const revalidate = 300;

export default async function Home() {
  let videos: Awaited<ReturnType<typeof getHome>> = [];
  try {
    videos = await getHome();
  } catch {
    // getHome() throwing (source site down/blocking) shouldn't 500 the whole
    // page - VideoGrid shows a friendly empty state and points at /api/scrape
    // for debugging instead.
    videos = [];
  }

  return (
    <main>
      <Navbar />
      <Hero />
      <VideoGrid videos={videos} />
      <Footer />
    </main>
  );
}
