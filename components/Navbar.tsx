"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { label: "Beranda", href: "/" },
  { label: "Anime", href: "/?kategori=Anime Series" },
  { label: "Film", href: "/?kategori=Film Movie" },
  { label: "Series", href: "/?kategori=TV Series" },
  { label: "Shorts", href: "/?kategori=Shorts" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    window.location.href = `/cari?q=${encodeURIComponent(query.trim())}`;
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-studio-bg/85 backdrop-blur-sm border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-rec-pulse rounded-full bg-studio-rec" />
          </span>
          <span className="font-display font-bold text-lg tracking-tight">
            Hidaka<span className="text-studio-rec">Dubb</span>
          </span>
        </a>

        {!searchOpen && (
          <nav className="hidden md:flex items-center gap-7 font-mono text-[13px] uppercase tracking-wide text-studio-muted">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="relative py-1 transition-colors hover:text-studio-paper"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {searchOpen ? (
            <motion.form
              key="search-form"
              onSubmit={submitSearch}
              initial={{ opacity: 0, width: 40 }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0, width: 40 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-studio-panel px-4 py-2 max-w-md ml-4"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-studio-muted shrink-0">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => !query && setSearchOpen(false)}
                placeholder="Cari judul..."
                className="bg-transparent outline-none text-sm text-studio-paper placeholder:text-studio-muted w-full"
              />
            </motion.form>
          ) : (
            <motion.button
              key="search-button"
              type="button"
              onClick={() => setSearchOpen(true)}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-studio-panel px-4 py-2 text-sm text-studio-muted hover:text-studio-paper hover:border-white/20 transition-colors"
              aria-label="Cari"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="hidden sm:inline">Cari judul...</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
