"use client";
import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

export function AudioNote({ src, label, tone = "light" }: { src: string; label?: string; tone?: "light" | "dark" }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  return (
    <div className={`flex items-center gap-2 rounded-full px-1.5 py-1 ${tone === "dark" ? "bg-white/15" : "bg-black/5"}`}>
      <button
        type="button"
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused) void a.play();
          else a.pause();
        }}
        className={`flex size-9 items-center justify-center rounded-full ${tone === "dark" ? "bg-card text-brand" : "bg-brand text-white"}`}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
      </button>
      <div className={`h-1.5 w-24 overflow-hidden rounded-full ${tone === "dark" ? "bg-white/30" : "bg-black/10"}`}>
        <div className={`h-full ${tone === "dark" ? "bg-card" : "bg-brand"}`} style={{ width: `${progress * 100}%` }} />
      </div>
      {label && <span className="pr-2 text-xs opacity-80">{label}</span>}
      <audio
        ref={ref}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (a.duration && isFinite(a.duration)) setProgress(a.currentTime / a.duration);
        }}
      />
    </div>
  );
}
