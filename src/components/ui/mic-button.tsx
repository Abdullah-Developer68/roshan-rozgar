"use client";
import { Mic, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { useVoiceStore, type VoiceResult } from "@/stores/voice-store";
import { Spinner } from "@/components/ui/spinner";

/** Tap to talk, tap again to stop. Live state comes from the shared voice store. */
export function MicButton({
  id,
  onDone,
  record = false,
  size = "xl",
  lang,
  disabled,
}: {
  id: string;
  onDone: (r: VoiceResult) => void;
  record?: boolean;
  size?: "xl" | "md";
  lang?: string;
  disabled?: boolean;
}) {
  const ownerId = useVoiceStore((s) => s.ownerId);
  const status = useVoiceStore((s) => s.status);
  const startedAt = useVoiceStore((s) => s.startedAt);
  const sttLang = useVoiceStore((s) => s.sttLang);
  const start = useVoiceStore((s) => s.start);
  const stop = useVoiceStore((s) => s.stop);
  const mine = ownerId === id;
  const live = mine && status === "listening";
  const processing = mine && status === "processing";
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [live]);

  const secs = live && startedAt && now ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const dim = size === "xl" ? "size-28" : "size-14";
  const icon = size === "xl" ? "size-12" : "size-6";

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={disabled || processing}
        aria-label={live ? "Stop recording" : "Start speaking"}
        aria-pressed={live}
        onClick={() => (live ? stop() : void start({ ownerId: id, lang: lang ?? sttLang, record, onDone }))}
        className={`relative flex ${dim} items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 disabled:opacity-60 ${
          live ? "mic-live bg-danger" : "bg-brand hover:bg-brand-2"
        }`}
      >
        {processing ? <Spinner className={icon} /> : live ? <Square className={`${icon} fill-white`} /> : <Mic className={icon} />}
      </button>
      {size === "xl" && (
        <span className="h-5 text-sm font-semibold tabular-nums text-muted">{live ? `0:${String(secs).padStart(2, "0")}` : ""}</span>
      )}
    </div>
  );
}
