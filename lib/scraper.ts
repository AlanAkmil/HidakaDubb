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

export type VideoSource = { label: string; url: string };

export type VideoDetail = {
  title: string;
  url: string;
  videoSrc: string | null;
  videoSources: VideoSource[]; // multiple qualities if the source page exposes them
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
 * The watch slug always ends in "_<id>.html" and the confirmed embed URL
 * pattern is /embed/<id>?color=<hex, no #>. Deriving it straight from the
 * filename is more reliable than scraping for an embed link on the page
 * (which isn't always present) - it works for every video unconditionally.
 */
function extractEmbedId(watchPath: string): string | null {
  const match = watchPath.match(/_([A-Za-z0-9]+)\.html$/);
  return match ? match[1] : null;
}

export function buildEmbedUrl(watchPath: string, colorHex = "FF5A3C"): string | null {
  const id = extractEmbedId(watchPath);
  return id ? `${BASE_URL}/embed/${id}?color=${colorHex}` : null;
}

/**
 * Find the smallest DOM element that contains both given elements (their
 * lowest common ancestor).
 */
function lowestCommonAncestor($: cheerio.CheerioAPI, elA: any, elB: any): any {
  const chainA: any[] = [];
  let cur = $(elA);
  while (cur.length) {
    chainA.push(cur.get(0));
    cur = cur.parent();
  }
  const setA = new Set(chainA);
  let curB = $(elB);
  while (curB.length) {
    if (setA.has(curB.get(0))) return curB.get(0);
    curB = curB.parent();
  }
  return elA;
}

/**
 * Loose card parser: finds every <a href*="/watch/"> and reconstructs each
 * card from ALL anchors that share the same href, not just the first one
 * seen.
 *
 * The source site renders each video with TWO separate anchors pointing at
 * the same /watch/ URL: one wraps just the thumbnail <img> (no visible
 * text), the other wraps the title text inside a heading below it. The
 * previous version only ever read data out of whichever anchor it met
 * first, so about half the time the title never got read - which is why
 * some cards showed a real title and others showed "(unknown)".
 *
 * Fix: group anchors by href first, then use the lowest common ancestor
 * of ALL anchors sharing that href as the card container. This also fixes
 * a second bug where, on pages with a different layout (like /search),
 * climbing a fixed number of parent levels sometimes reached a shared
 * ancestor of multiple different cards, blending their text together and
 * producing identical duration/views/uploaded values for every result.
 */
function parseVideoCards($: cheerio.CheerioAPI): Video[] {
  const byHref = new Map<string, any[]>();
  $('a[href*="/watch/"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href) return;
    if (!byHref.has(href)) byHref.set(href, []);
    byHref.get(href)!.push(el);
  });

  const cards: Video[] = [];

  byHref.forEach((els, href) => {
    let containerEl = els[0];
    for (let i = 1; i < els.length; i++) {
      containerEl = lowestCommonAncestor($, containerEl, els[i]);
    }
    const container = $(containerEl);

    // Prefer lazy-load attributes over `src`: many tube-CMS templates only
    // fill `src` with a placeholder pixel and put the real image in
    // data-src, swapped in by JS on scroll (which we never run).
    const img = container.find("img").first();
    const thumb =
      img.attr("data-src") ||
      img.attr("data-original") ||
      img.attr("data-lazy-src") ||
      (img.attr("src") && !img.attr("src")!.startsWith("data:") ? img.attr("src") : null) ||
      null;

    // Title: check every anchor for this href (title attr, then visible
    // text), then fall back to the image alt or nearest heading/paragraph.
    let title: string | null = null;
    for (const el of els) {
      const a = $(el);
      title = a.attr("title")?.trim() || a.text().trim() || null;
      if (title) break;
    }
    if (!title) {
      title = img.attr("alt")?.trim() || container.find("h1,h2,h3,h4,p").first().text().trim() || null;
    }

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

    // Category: look for a link to /videos/category/<id> inside the card
    // and map the id back to its readable name via CATEGORIES; fall back
    // to the link's own text if the id isn't one we recognize.
    const catA = container.find('a[href*="/videos/category/"]').first();
    let category: string | null = null;
    if (catA.length) {
      const catHref = catA.attr("href") || "";
      const idMatch = catHref.match(/\/videos\/category\/([^/?#]+)/);
      const id = idMatch ? idMatch[1] : null;
      const byId = id
        ? Object.entries(CATEGORIES).find(([, v]) => String(v) === String(id))
        : undefined;
      category = byId ? byId[0] : catA.text().trim() || null;
    }

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
      category,
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

  // video source: try several known patterns, in order of reliability.
  // 1) plain <a href="....mp4">, confirmed on some pages
  // 2) <video><source src="....mp4">
  // 3) JW Player-style config embedded in a <script>: "file":"....mp4"
  // 4) any .mp4 URL anywhere in the raw HTML (last resort)
  let videoSrc: string | null =
    $('a[href$=".mp4"], a[href*=".mp4?"]').first().attr("href") ||
    $("video source").first().attr("src") ||
    $("video").first().attr("src") ||
    null;

  if (!videoSrc) {
    const fileMatch = html.match(/"file"\s*:\s*"([^"]+\.mp4[^"]*)"/i);
    if (fileMatch) videoSrc = fileMatch[1].replace(/\\\//g, "/");
  }
  if (!videoSrc) {
    const rawMatch = html.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i);
    if (rawMatch) videoSrc = rawMatch[0];
  }

  // Multiple qualities: look for a JW Player-style "sources":[...] block
  // with {file,label} pairs, then <video><source> tags with a label/res
  // attribute, then plain <a href="...mp4"> links whose text looks like
  // a resolution (e.g. "720p", "HD", "SD"). If none of these patterns are
  // present, the source page simply doesn't offer multiple qualities -
  // there is only ever one videoSrc/embedUrl to play in that case.
  const videoSources: VideoSource[] = [];
  const seenSrc = new Set<string>();
  const addSource = (label: string, url: string | undefined | null) => {
    if (!url) return;
    const abs = url.startsWith("http") ? url : new URL(url, BASE_URL).toString();
    if (seenSrc.has(abs)) return;
    seenSrc.add(abs);
    videoSources.push({ label, url: abs });
  };

  const sourcesBlockMatch = html.match(/"sources"\s*:\s*(\[[^\]]*\])/i);
  if (sourcesBlockMatch) {
    try {
      const raw = sourcesBlockMatch[1].replace(/\\\//g, "/");
      const parsed = JSON.parse(raw) as Array<{ file?: string; label?: string; res?: string }>;
      parsed.forEach((s) => addSource(s.label || s.res || "auto", s.file));
    } catch {
      // malformed/partial JSON in the page - ignore and fall through
    }
  }
  $("video source").each((_, el) => {
    const s = $(el);
    const label = s.attr("label") || s.attr("size") || s.attr("res") || s.attr("title");
    if (label) addSource(label, s.attr("src"));
  });
  $('a[href$=".mp4"], a[href*=".mp4?"]').each((_, el) => {
    const a = $(el);
    const text = a.text().trim();
    if (/^\d{3,4}p$|^(HD|SD|FHD|4K)$/i.test(text)) addSource(text, a.attr("href"));
  });
  if (videoSources.length === 0 && videoSrc) {
    addSource("default", videoSrc);
  }

  const embedA = $('a[href*="/embed/"]').first().attr("href");
  const embedIframe = $('iframe[src*="/embed/"]').first().attr("src");
  const scrapedEmbedUrl =
    embedA || embedIframe ? new URL((embedA || embedIframe)!, BASE_URL).toString() : null;
  // buildEmbedUrl() derives the URL straight from the slug filename, so it
  // works even when the page doesn't expose an embed link/iframe directly.
  const embedUrl = scrapedEmbedUrl || buildEmbedUrl(cleanPath);

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
    videoSources,
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
 * Search endpoint dikonfirmasi lewat live fetch: /search?keyword=<query>
 * (bukan ?q= seperti pola umum tube-CMS lainnya). Ada juga varian
 * ?lang=... di situs yang sama, jadi param keyword ini yang benar.
 */
export async function search(query: string): Promise<{ pathTried: string; results: Video[] }> {
  const q = encodeURIComponent(query);
  const candidates = [`/search?keyword=${q}`, `/search?q=${q}`, `/search/${q}`];

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
