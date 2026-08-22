import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#14111F",
          panel: "#1E1830",
          panel2: "#251E3B",
          rec: "#FF5A3C",
          amber: "#F4B942",
          paper: "#F5F1E8",
          muted: "#A79FC0",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        waveform: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "rec-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        "rec-pulse": "rec-pulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
