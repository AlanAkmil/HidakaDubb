import Waveform from "./Waveform";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-studio-panel/40">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="font-display font-bold text-lg">
            Hidaka<span className="text-studio-rec">Dubb</span>
          </div>
          <p className="mt-2 text-sm text-studio-muted max-w-xs">
            Dibuat buat penggemar dubbing Indonesia. Judul baru masuk tiap minggu.
          </p>
        </div>
        <Waveform bars={30} active={false} className="h-8 w-40" color="#A79FC0" />
      </div>
      <div className="border-t border-white/5 py-5 text-center font-mono text-[11px] text-studio-muted">
        © {new Date().getFullYear()} HidakaDubb
      </div>
    </footer>
  );
}
