import * as cheerio from "cheerio";

export const BASE_URL = "https://www.dubbindo.site";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

export type Video = {
  title: string;
  url: string; // full watch URL
  path: string; // path after /watch/ - used as the internal route slug
  thumbnail: string | null;
  duration: string | null;
  uploader: string | null;
  uploaderUrl: string | null;
  views: string | null;
  uploaded: string | null;
  category: string | null;
};

export type VideoDetail = {
  title: string;
  url: string;
  videoSrc: string | null;
  embedUrl: string | null;
  downloadLink: string | null;
  uploader: string | null;
  uploaderUrl: string | null;
  views: string | null;
  duration: string | null;
  category: string | null;
  uploadDate: string | null;
  thumbnail: string | null;
  synopsis: string | null;
};

async function fetchHTML(path: string): Promise<string> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return res.text();
}

function pathFromWatchHref(href: string): string {
  // href is like "/watch/cars-2006-dubbing-indonesia_xxxx.html" or full URL
  const idx = href.indexOf("/watch/");
  return idx >= 0 ? href.slice(idx + "/watch/".length) : href;
}

/**
 * Loose card parser: finds every <a href*="/watch/"> and walks up a few
 * parent levels to pull duration/views/uploader text out of the
 * surrounding block. Deliberately not tied to exact class names so small
 * theme tweaks on the source site don't break it outright.
 */
function parseVideoCards($: cheerio.CheerioAPI): Video[] {
  const seen = new Set<string>();
  const cards: Video[] = [];

  $('a[href*="/watch/"]').each((_, el) => {
    const a = $(el);
    const href = a.attr("href") || "";
    if (!href || seen.has(href)) return;
    seen.add(href);

    let container = a;
    for (let i = 0; i < 4; i++) {
      const parent = container.parent();
      if (parent.length) container = parent;
      else break;
    }

    const title = a.attr("title")?.trim() || a.text().trim() || null;
    const img = a.find("img").first().attr("src") || container.find("img").first().attr("src") || null;
    const thumb = img || container.find("img").first().attr("data-src") || null;

    const text = container.text().replace(/\s+/g, " ").trim();

    const durationMatch = text.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
    const viewsMatch = text.match(/([\d,.]+)\s*Views/i);
    const uploadedMatch = text.match(
      /(\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago)/i
    );

    const uploaderA = container.find('a[href*="/@"]').first();
    const uploader = uploaderA.length ? uploaderA.text().trim() : null;
    const uploaderUrl = uploaderA.length
      ? new URL(uploaderA.attr("href") || "", BASE_URL).toString()
      : null;

    const fullUrl = new URL(href, BASE_URL).toString();

    cards.push({
      title: title || "(unknown)",
      url: fullUrl,
      path: pathFromWatchHref(href),
      thumbnail: thumb,
      duration: durationMatch ? durationMatch[0] : null,
      uploader,
      uploaderUrl,
      views: viewsMatch ? viewsMatch[1] : null,
      uploaded: uploadedMatch ? uploadedMatch[1] : null,
      category: null,
    });
  });

  return cards;
}

export async function getHome(): Promise<Video[]> {
  const html = await fetchHTML("/");
  const $ = cheerio.load(html);
  return parseVideoCards($);
}

export async function getCategory(categoryId: number | string, page = 1): Promise<Video[]> {
  let path = `/videos/category/${categoryId}`;
  if (page > 1) path += `?page=${page}`;
  const html = await fetchHTML(path);
  const $ = cheerio.load(html);
  return parseVideoCards($);
}

export async function getListing(
  kind: "latest" | "trending" | "top" | "shorts",
  page = 1
): Promise<Video[]> {
  let path = kind === "shorts" ? "/shorts" : `/videos/${kind}`;
  if (page > 1) path += `?page=${page}`;
  const html = await fetchHTML(path);
  const $ = cheerio.load(html);
  return parseVideoCards($);
}

export async function getWatchDetail(watchPath: string): Promise<VideoDetail> {
  const cleanPath = watchPath.replace(/^\/?watch\//, "");
  const html = await fetchHTML(`/watch/${cleanPath}`);
  const $ = cheerio.load(html);
  const fullUrl = `${BASE_URL}/watch/${cleanPath}`;

  const title = $("h1").first().text().trim() || $("title").text().trim() || "(unknown)";

  // video source: <a> ending in .mp4, confirmed pattern on live pages
  const videoA = $('a[href$=".mp4"], a[href*=".mp4?"]').first();
  const videoSrc = videoA.attr("href") || null;

  const embedA = $('a[href*="/embed/"]').first();
  const embedUrl = embedA.length ? new URL(embedA.attr("href") || "", BASE_URL).toString() : null;

  let synopsis: string | null = null;
  let downloadLink: string | null = null;
  $("p").each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, " ").trim();
    if (!txt) return;
    if (/Download\s*:/i.test(txt) && !downloadLink) {
      const m = txt.match(/https?:\/\/\S+/);
      if (m) downloadLink = m[0].replace(/[.,]+$/, "");
    }
    if (txt.length > 60 && !synopsis) {
      synopsis = txt.includes("Download:") ? txt.split("Download:")[0].trim() : txt;
    }
  });

  if (!downloadLink) {
    const dlBtn = $('a[href*="get.dubbindo.site"]').first();
    if (dlBtn.length) downloadLink = dlBtn.attr("href") || null;
  }

  const uploaderA = $('a[href*="/@"]').first();
  const uploader = uploaderA.length ? uploaderA.text().trim() : null;
  const uploaderUrl = uploaderA.length
    ? new URL(uploaderA.attr("href") || "", BASE_URL).toString()
    : null;

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const viewsMatch = bodyText.match(/([\d,.]+)\s*Views/i);
  const durationMatch = bodyText.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
  const dateMatch = bodyText.match(/\b\d{2}\/\d{2}\/\d{2}\b/);

  const catA = $('a[href*="/videos/category/"]').first();
  const category = catA.length ? catA.text().trim() : null;

  const thumbnail = $('meta[property="og:image"]').attr("content") || null;

  return {
    title,
    url: fullUrl,
    videoSrc,
    embedUrl,
    downloadLink,
    uploader,
    uploaderUrl,
    views: viewsMatch ? viewsMatch[1] : null,
    duration: durationMatch ? durationMatch[0] : null,
    category,
    uploadDate: dateMatch ? dateMatch[0] : null,
    thumbnail,
    synopsis,
  };
}

/**
 * Search endpoint pattern is still unconfirmed (no static form/link found
 * on the source site - it's likely loaded via client-side JS). Tries a
 * few common tube-CMS patterns and returns whichever first yields cards.
 * Update `candidates` once the real pattern is confirmed.
 */
export async function search(query: string): Promise<{ pathTried: string; results: Video[] }> {
  const q = encodeURIComponent(query);
  const candidates = [`/search?q=${q}`, `/search/${q}`, `/videos/search?q=${q}`];

  for (const path of candidates) {
    try {
      const html = await fetchHTML(path);
      const $ = cheerio.load(html);
      const results = parseVideoCards($);
      if (results.length > 0) {
        return { pathTried: path, results };
      }
    } catch {
      continue;
    }
  }
  return { pathTried: candidates.join(" | "), results: [] };
}

export const CATEGORIES: Record<string, number | string> = {
  "Film Movie": 1,
  "TV Series": 3,
  "Anime Movie": 4,
  "Anime Series": 5,
  Other: "other",
  "#Shorts": 790,
  Uncategory: 791,
};
