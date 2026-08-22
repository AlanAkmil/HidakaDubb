# HidakaDubb

Web dubbing/streaming Indonesia — Next.js 14 (App Router) + TypeScript +
Tailwind + Framer Motion. Scraping-nya jalan **di dalam Next.js sendiri**
(server-side, pakai `cheerio`), gak ada Python/tool terpisah lagi.

## Jalanin lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Cara kerja scraping

- `lib/scraper.ts` — semua logic scraping (home, kategori, listing, detail
  video, search). Jalan di server (Node.js runtime Next.js), fetch
  `www.dubbindo.site` langsung, jadi **gak kena CORS** kayak kalau fetch dari
  browser.
- `app/page.tsx` — server component, manggil `getHome()` pas request masuk
  (di-cache 5 menit lewat `revalidate`).
- `app/watch/[...slug]/page.tsx` — halaman detail video, fetch data asli +
  mainin video dari `videoSrc` (URL mp4 asli) atau fallback ke `embedUrl`.
- `app/api/scrape/route.ts` — **API route buat debug**. Setelah di-deploy ke
  Vercel, ini jadi link JSON beneran yang bisa dibuka langsung di browser:
  - `https://<domain-lu>.vercel.app/api/scrape?type=home`
  - `https://<domain-lu>.vercel.app/api/scrape?type=category&id=5`
  - `https://<domain-lu>.vercel.app/api/scrape?type=listing&kind=latest`
  - `https://<domain-lu>.vercel.app/api/scrape?type=watch&path=<slug>.html`
  - `https://<domain-lu>.vercel.app/api/scrape?type=search&q=cars`

## Belum kelar: search

Endpoint search di situs sumber belum ketemu pola URL-nya (kemungkinan
dimuat via JS/AJAX, gak ada form statis di HTML). `lib/scraper.ts ->
search()` udah nyoba 3 pola umum tube-CMS, tapi belum terverifikasi jalan.

Cara paling gampang buat konfirmasi: buka `www.dubbindo.site` di HP, ketik
sesuatu di kolom cari, terus **copy URL di address bar** pas hasil
pencariannya muncul. Kirim URL itu (atau update sendiri array `candidates`
di `search()` kalau polanya udah ketauan).

## Deploy ke Vercel

1. Extract zip ini
2. Push **isi folder ini** (bukan folder pembungkusnya) ke root repo GitHub
3. Import repo di Vercel — bakal auto-kedetect Next.js karena `package.json`
   ada di root
4. Setelah deploy, buka `/api/scrape?type=home` di domain Vercel-nya buat
   ngecek scraping-nya beneran jalan di server produksi

## Catatan performa

- Semua animasi pakai `transform`/`opacity` (GPU-friendly).
- `whileInView` di card cuma jalan sekali per elemen.
- `prefers-reduced-motion` dihormati secara global.
- Data di-cache 5 menit (`revalidate = 300`) biar gak nge-hit
  dubbindo.site tiap kali ada yang buka web-nya.
