import { NextRequest, NextResponse } from "next/server";
import { getHome, getCategory, getListing, getWatchDetail, search, CATEGORIES } from "@/lib/scraper";

export const dynamic = "force-dynamic";

// Usage once deployed (replace with your real domain):
//   /api/scrape?type=home
//   /api/scrape?type=category&id=5
//   /api/scrape?type=listing&kind=latest
//   /api/scrape?type=watch&path=cars-2006-dubbing-indonesia_MVRGx2VzbTZb2mm.html
//   /api/scrape?type=search&q=cars
// Debug endpoint gate: set SCRAPE_DEBUG_KEY in Vercel's env vars, then hit
// this route with ?key=<value>. Without a key configured, the route works
// unrestricted (handy for local dev) - but once deployed, set the env var
// so randoms can't hammer your server to scrape dubbindo.site for free.
function isAuthorized(req: NextRequest): boolean {
  const requiredKey = process.env.SCRAPE_DEBUG_KEY;
  if (!requiredKey) return true;
  const { searchParams } = new URL(req.url);
  return searchParams.get("key") === requiredKey;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "home";

  try {
    switch (type) {
      case "home": {
        const videos = await getHome();
        return NextResponse.json({ type, count: videos.length, videos });
      }
      case "category": {
        const id = searchParams.get("id") || "5";
        const page = Number(searchParams.get("page") || "1");
        const videos = await getCategory(id, page);
        return NextResponse.json({ type, id, page, count: videos.length, videos });
      }
      case "listing": {
        const kind = (searchParams.get("kind") || "latest") as
          | "latest"
          | "trending"
          | "top"
          | "shorts";
        const page = Number(searchParams.get("page") || "1");
        const videos = await getListing(kind, page);
        return NextResponse.json({ type, kind, page, count: videos.length, videos });
      }
      case "watch": {
        const path = searchParams.get("path");
        if (!path) {
          return NextResponse.json({ error: "Param 'path' wajib diisi" }, { status: 400 });
        }
        const detail = await getWatchDetail(path);
        return NextResponse.json({ type, detail });
      }
      case "search": {
        const q = searchParams.get("q");
        if (!q) {
          return NextResponse.json({ error: "Param 'q' wajib diisi" }, { status: 400 });
        }
        const { pathTried, results } = await search(q);
        return NextResponse.json({
          type,
          q,
          pathTried,
          count: results.length,
          results,
        });
      }
      case "categories": {
        return NextResponse.json({ type, categories: CATEGORIES });
      }
      default:
        return NextResponse.json({ error: `type '${type}' tidak dikenal` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 502 }
    );
  }
}
