export type Video = {
  slug: string;
  title: string;
  category: "Anime Series" | "Anime Movie" | "Film Movie" | "TV Series" | "Shorts";
  thumbnail: string;
  duration: string;
  views: string;
  uploaded: string;
  synopsis: string;
};

export const categories = [
  "Anime Series",
  "Anime Movie",
  "Film Movie",
  "TV Series",
  "Shorts",
] as const;

// Data contoh — gampang diganti nanti dengan hasil scraper
// (lihat dubbindo_scraper.py: DubbindoScraper.home() / .category() / .listing()).
export const videos: Video[] = [
  {
    slug: "wandering-blade-s1e1",
    title: "Wandering Blade — S1E1: Gerbang Kabut",
    category: "Anime Series",
    thumbnail: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
    duration: "23:41",
    views: "128K",
    uploaded: "2 hari lalu",
    synopsis: "Seorang pengembara pedang menyusuri kota yang tertutup kabut abadi, mencari jejak gurunya yang hilang.",
  },
  {
    slug: "ashfall-requiem",
    title: "Ashfall Requiem",
    category: "Anime Movie",
    thumbnail: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80",
    duration: "1:42:10",
    views: "342K",
    uploaded: "1 minggu lalu",
    synopsis: "Dua saudara terpisah gunung berapi yang meletus, berjuang menyatukan kembali desa yang hancur.",
  },
  {
    slug: "nightshift-dispatch-s2e5",
    title: "Nightshift Dispatch — S2E5",
    category: "TV Series",
    thumbnail: "https://images.unsplash.com/photo-1483736762161-1d107f3c78e1?w=800&q=80",
    duration: "41:12",
    views: "76K",
    uploaded: "5 jam lalu",
    synopsis: "Operator radio darurat malam hari menangani kasus yang lebih aneh dari biasanya.",
  },
  {
    slug: "the-quiet-harbor",
    title: "The Quiet Harbor",
    category: "Film Movie",
    thumbnail: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=800&q=80",
    duration: "1:56:33",
    views: "210K",
    uploaded: "3 minggu lalu",
    synopsis: "Seorang nelayan tua mengajarkan cucunya arti pulang, satu musim terakhir sebelum pensiun.",
  },
  {
    slug: "glass-orchestra-ep3",
    title: "Glass Orchestra — Ep. 3",
    category: "Anime Series",
    thumbnail: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80",
    duration: "24:02",
    views: "95K",
    uploaded: "1 hari lalu",
    synopsis: "Konservatori musik rahasia melatih murid-muridnya memainkan alat yang bisa membentuk realita.",
  },
  {
    slug: "clip-first-flight",
    title: "First Flight (Clip)",
    category: "Shorts",
    thumbnail: "https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=800&q=80",
    duration: "0:58",
    views: "1.2M",
    uploaded: "9 jam lalu",
    synopsis: "Momen singkat sebelum lepas landas.",
  },
];

export function getBySlug(slug: string) {
  return videos.find((v) => v.slug === slug);
}

export function byCategory(category: string) {
  return videos.filter((v) => v.category === category);
}
