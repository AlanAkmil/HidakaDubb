# HidakaDubb

Web dubbing/streaming Indonesia, dibangun dengan Next.js 14 (App Router) +
TypeScript + Tailwind + Framer Motion.

## Jalanin lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Struktur

- `app/page.tsx` — homepage (Hero + grid video dengan filter kategori)
- `app/watch/[slug]/page.tsx` — halaman detail video
- `components/Waveform.tsx` — signature element: bar animasi ala waveform
  suara, dipakai di navbar, hero, card, dan footer
- `lib/data.ts` — data video contoh. Ganti isinya dengan hasil scraper
  (`dubbindo_scraper.py`) kalau mau dihubungkan ke data asli.

## Catatan performa

- Semua animasi pakai `transform`/`opacity` (GPU-friendly), gak ada
  animasi yang nge-trigger layout/reflow.
- `whileInView` di card cuma jalan sekali per elemen (`viewport={{ once: true }}`)
  supaya gak re-trigger tiap scroll naik-turun.
- `prefers-reduced-motion` dihormati secara global lewat `globals.css`.
- Gambar pakai `loading="lazy"`. Kalau nanti sumber gambar dari domain lain,
  tambahin hostname-nya ke `next.config.js` (atau ganti ke `next/image`
  buat optimasi otomatis).

## Belum dikerjain / next steps

- Integrasi data asli dari `dubbindo_scraper.py`
- Fungsi search (nunggu pola URL search situs sumber diverifikasi)
- Player video sungguhan (sekarang masih placeholder thumbnail + tombol play)
