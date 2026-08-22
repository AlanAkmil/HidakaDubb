"""
Scraper untuk dubbindo.site (UVideo-based tube CMS)

Cover:
- Home page (featured, trending, shorts, top, latest, per-kategori)
- Listing pages (/videos/category/<id>, /videos/trending, /videos/top,
  /videos/latest, /shorts, /popular_channels)
- Video detail (/watch/<slug>.html) -> judul, deskripsi, link download,
  uploader, views, durasi, kategori
- Channel page (/@username)
- Search (belum diverifikasi live, ada 2 fallback pattern - lihat catatan
  di fungsi search())

CATATAN PENTING:
- Ditulis berdasarkan pola HTML yang teramati di homepage (bukan hasil
  test langsung ke semua endpoint karena sandbox tempat gua kerja gak
  punya akses network). Selector pakai pendekatan "loose" (regex pada
  href, bukan class CSS spesifik) supaya lebih tahan kalau ada
  perubahan minor di tema.
- Sebelum dipakai serius, jalanin dulu manual (python dubbindo_scraper.py)
  buat cek hasilnya sesuai apa nggak, terutama fungsi search() dan
  extract dari halaman /watch/.
- Situs ini punya gate umur (18+) tapi itu cuma modal JS di sisi client,
  gak nge-block request HTTP biasa.
"""

import re
import json
import time
from dataclasses import dataclass, asdict
from typing import Optional
from urllib.parse import urljoin, quote

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.dubbindo.site"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}


@dataclass
class VideoCard:
    title: str
    url: str
    thumbnail: Optional[str]
    duration: Optional[str]
    uploader: Optional[str]
    uploader_url: Optional[str]
    views: Optional[str]
    uploaded: Optional[str]
    category: Optional[str] = None


@dataclass
class VideoDetail:
    title: str
    url: str
    description: Optional[str]
    download_link: Optional[str]
    uploader: Optional[str]
    uploader_url: Optional[str]
    views: Optional[str]
    duration: Optional[str]
    category: Optional[str]
    upload_date: Optional[str]
    thumbnail: Optional[str]
    video_src: Optional[str] = None
    embed_url: Optional[str] = None


class DubbindoScraper:
    def __init__(self, base_url: str = BASE_URL, delay: float = 1.0):
        self.base_url = base_url.rstrip("/")
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    # ---------- low level ----------

    def _get(self, path: str, **kwargs) -> BeautifulSoup:
        url = path if path.startswith("http") else urljoin(self.base_url + "/", path.lstrip("/"))
        resp = self.session.get(url, timeout=20, **kwargs)
        resp.raise_for_status()
        time.sleep(self.delay)  # sopan santun ke server, jangan diburu-buru
        return BeautifulSoup(resp.text, "html.parser")

    # ---------- generic video-card parser ----------
    # Tube-script kayak gini biasanya ngerender tiap video sebagai blok
    # berisi: <a href="/watch/slug.html"><img></a> + judul + durasi +
    # link channel + views + waktu upload. Kita cari tiap <a href="/watch/">
    # lalu jelajah parent-nya buat ambil metadata di sekitarnya.

    def _parse_video_cards(self, soup: BeautifulSoup) -> list[VideoCard]:
        seen = set()
        cards = []
        for a in soup.select('a[href*="/watch/"]'):
            href = a.get("href", "")
            if not href or href in seen:
                continue
            # lewati anchor yang cuma bungkus thumbnail tanpa judul kalau
            # ada duplikat title-only di dekatnya - kita simpan by href unik
            seen.add(href)

            container = a
            # naik beberapa level buat nemu blok video utuh
            for _ in range(4):
                if container.parent:
                    container = container.parent
                else:
                    break

            title = a.get("title") or a.get_text(strip=True)
            if not title:
                title_tag = container.find(["h3", "h4", "p"])
                title = title_tag.get_text(strip=True) if title_tag else None

            img = a.find("img") or container.find("img")
            thumb = None
            if img:
                thumb = img.get("src") or img.get("data-src")

            text_block = container.get_text(" ", strip=True)
            duration_match = re.search(r"\b\d{1,2}:\d{2}(?::\d{2})?\b", text_block)
            duration = duration_match.group(0) if duration_match else None

            views_match = re.search(r"([\d,\.]+)\s*Views", text_block, re.I)
            views = views_match.group(1) if views_match else None

            uploaded_match = re.search(
                r"(\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago)",
                text_block, re.I,
            )
            uploaded = uploaded_match.group(1) if uploaded_match else None

            uploader_a = container.find("a", href=re.compile(r"/@"))
            uploader = uploader_a.get_text(strip=True) if uploader_a else None
            uploader_url = urljoin(self.base_url, uploader_a["href"]) if uploader_a else None

            cards.append(
                VideoCard(
                    title=title or "(unknown)",
                    url=urljoin(self.base_url, href),
                    thumbnail=thumb,
                    duration=duration,
                    uploader=uploader,
                    uploader_url=uploader_url,
                    views=views,
                    uploaded=uploaded,
                )
            )
        return cards

    # ---------- pages ----------

    def home(self) -> dict:
        """Scrape homepage: featured + semua section (trending, shorts, top, latest, per kategori)."""
        soup = self._get("/")
        result = {"all_videos": [asdict(c) for c in self._parse_video_cards(soup)]}

        # section headers biasanya <h5>/<h4> dengan teks kayak "Trending",
        # "Shorts", "Top videos", "Latest videos", nama kategori, dll.
        sections = {}
        for header in soup.find_all(["h2", "h3", "h4", "h5"]):
            title = header.get_text(strip=True)
            if not title or title.lower() in ("featured video",):
                continue
            # ambil node-node video sampai header berikutnya
            sib_cards = []
            for sib in header.find_all_next():
                if sib.name in ("h2", "h3", "h4", "h5"):
                    break
                if sib.name == "a" and "/watch/" in sib.get("href", ""):
                    sib_cards.append(sib)
            if sib_cards:
                section_soup = BeautifulSoup("", "html.parser")
                for tag in sib_cards:
                    section_soup.append(tag)
                sections[title] = [asdict(c) for c in self._parse_video_cards(soup)][: len(sib_cards)]

        result["sections_detected"] = list(sections.keys())
        return result

    def category(self, category_id: int, page: int = 1) -> list[VideoCard]:
        path = f"/videos/category/{category_id}"
        if page > 1:
            path += f"?page={page}"
        soup = self._get(path)
        return self._parse_video_cards(soup)

    def listing(self, kind: str, page: int = 1) -> list[VideoCard]:
        """kind: 'latest' | 'trending' | 'top' | 'shorts'"""
        assert kind in ("latest", "trending", "top", "shorts")
        path = f"/{'shorts' if kind == 'shorts' else 'videos/' + kind}"
        if page > 1:
            path += f"?page={page}"
        soup = self._get(path)
        return self._parse_video_cards(soup)

    def channel(self, username: str) -> dict:
        soup = self._get(f"/@{username.lstrip('@')}")
        videos = self._parse_video_cards(soup)
        name_tag = soup.find(["h1", "h2"])
        return {
            "username": username,
            "display_name": name_tag.get_text(strip=True) if name_tag else None,
            "videos": [asdict(v) for v in videos],
        }

    def video_detail(self, url: str) -> VideoDetail:
        """
        Selector di sini sudah dikonfirmasi lewat live fetch beneran ke
        /watch/cars-2006-dubbing-indonesia_MVRGx2VzbTZb2mm.html - bukan
        tebakan lagi. Struktur terkonfirmasi:
        - URL video mp4 muncul polos sebagai <a href="...mp4"> tepat
          sebelum tag <video> (stream.dubbindo.site/uvideoweb/...)
        - Link download muncul 2x: sebagai teks "Download: <url>" (short
          link sht.dubbindo.xyz) di deskripsi, dan tombol terpisah
          "Download" yang link ke get.dubbindo.site/<uploader>/<code>
        - Halaman punya embed URL di /embed/<id> (id = suffix slug)
        """
        soup = self._get(url)

        title_tag = soup.find("h1") or soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else "(unknown)"

        # video source: <a> yang href-nya berakhiran .mp4, biasanya tepat
        # sebelum tag <video>
        video_a = soup.find("a", href=re.compile(r"\.mp4($|\?)", re.I))
        video_src = video_a["href"] if video_a else None

        # embed url pola /embed/<id>
        embed_a = soup.find("a", href=re.compile(r"/embed/"))
        embed_url = urljoin(self.base_url, embed_a["href"]) if embed_a else None

        # deskripsi: paragraf panjang deket tombol share/download,
        # sekaligus berisi baris "Download: <short-link>"
        desc = None
        download_link = None
        for p in soup.find_all("p"):
            txt = p.get_text(" ", strip=True)
            if "Download" in txt:
                m = re.search(r"https?://\S+", txt)
                if m:
                    download_link = m.group(0).rstrip(".,")
            if len(txt) > 60 and desc is None:
                desc = txt
        if desc and "Download:" in desc:
            desc = desc.split("Download:")[0].strip()

        # tombol "Download" terpisah -> get.dubbindo.site/<uploader>/<code>
        download_btn = soup.find("a", href=re.compile(r"get\.dubbindo\.site", re.I))
        download_button_link = download_btn["href"] if download_btn else None

        uploader_a = soup.find("a", href=re.compile(r"/@"))
        uploader = uploader_a.get_text(strip=True) if uploader_a else None
        uploader_url = urljoin(self.base_url, uploader_a["href"]) if uploader_a else None

        text_block = soup.get_text(" ", strip=True)
        views_match = re.search(r"([\d,\.]+)\s*Views", text_block, re.I)
        duration_match = re.search(r"\b\d{1,2}:\d{2}(?::\d{2})?\b", text_block)
        category = None
        cat_a = soup.find("a", href=re.compile(r"/videos/category/\d"))
        if cat_a:
            category = cat_a.get_text(strip=True)

        thumb_meta = soup.find("meta", property="og:image")
        thumb = thumb_meta["content"] if thumb_meta else None

        date_match = re.search(r"\b\d{2}/\d{2}/\d{2}\b", text_block)

        return VideoDetail(
            title=title,
            url=url,
            description=desc,
            download_link=download_link or download_button_link,
            uploader=uploader,
            uploader_url=uploader_url,
            views=views_match.group(1) if views_match else None,
            duration=duration_match.group(0) if duration_match else None,
            category=category,
            upload_date=date_match.group(0) if date_match else None,
            thumbnail=thumb,
            video_src=video_src,
            embed_url=embed_url,
        )

    def search(self, query: str) -> list[VideoCard]:
        """
        BELUM DIVERIFIKASI LIVE - pola URL search situs ini gak sempat
        ketemu. Dua kandidat paling umum dipakai tube-script sejenis:
          1. /search?q=<query>
          2. /search/<query>
        Fungsi ini coba pattern #1 dulu, kalau hasil videonya kosong,
        coba pattern #2. Kalau dua-duanya kosong / 404, cek manual di
        browser lalu sesuaikan `candidates` di bawah.
        """
        q = quote(query)
        candidates = [f"/search?q={q}", f"/search/{q}", f"/videos/search?q={q}"]
        for path in candidates:
            try:
                soup = self._get(path)
            except requests.HTTPError:
                continue
            cards = self._parse_video_cards(soup)
            if cards:
                return cards
        return []


# Kategori yang ketahuan dari homepage
CATEGORIES = {
    "Film Movie": 1,
    "TV Series": 3,
    "Anime Movie": 4,
    "Anime Series": 5,
    "Other": "other",
    "#Shorts": 790,
    "Uncategory": 791,
}


if __name__ == "__main__":
    scraper = DubbindoScraper(delay=1.0)

    print("=== HOME ===")
    home_data = scraper.home()
    print(f"Total video card ditemukan: {len(home_data['all_videos'])}")
    print(json.dumps(home_data["all_videos"][:3], indent=2, ensure_ascii=False))

    print("\n=== CATEGORY: Anime Series (id=5) ===")
    anime = scraper.category(5)
    print(f"Jumlah: {len(anime)}")
    if anime:
        print(json.dumps(asdict(anime[0]), indent=2, ensure_ascii=False))

    print("\n=== LATEST ===")
    latest = scraper.listing("latest")
    print(f"Jumlah: {len(latest)}")

    if latest:
        print("\n=== VIDEO DETAIL (video pertama dari latest) ===")
        detail = scraper.video_detail(latest[0].url)
        print(json.dumps(asdict(detail), indent=2, ensure_ascii=False))

    print("\n=== SEARCH: 'cars' ===")
    results = scraper.search("cars")
    print(f"Jumlah hasil: {len(results)} (kalau 0, cek catatan di fungsi search())")
