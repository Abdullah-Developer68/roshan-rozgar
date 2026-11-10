"use client";
import { AnimatePresence, motion } from "motion/react";
import { AudioLines, CloudDownload, TriangleAlert } from "lucide-react";
import { useVoiceStore } from "@/stores/voice-store";
import { useSttModelStore } from "@/stores/stt-model-store";
import { useT } from "@/lib/i18n";

/** One-line status under a mic: model download progress, transcription, or errors. */
export function SttStatus({ ownerId, className = "" }: { ownerId: string; className?: string }) {
  const { t } = useT();
  const mine = useVoiceStore((s) => s.ownerId === ownerId);
  const status = useVoiceStore((s) => s.status);
  const phase = useVoiceStore((s) => s.phase);
  const model = useSttModelStore((s) => s.status);
  const progress = useSttModelStore((s) => s.progress);
  const totalMb = useSttModelStore((s) => s.totalMb);

  let content: React.ReactNode = null;
  if (mine && model === "error") {
    content = (
      <>
        <TriangleAlert className="size-3.5 text-destructive" /> {t("sttModelError")}
      </>
    );
  } else if (mine && status === "processing" && phase === "transcribing-server") {
    content = (
      <>
        <AudioLines className="size-3.5 animate-pulse" /> {t("sttServer")}
      </>
    );
  } else if (mine && model === "loading") {
    content = (
      <span className="flex w-full flex-col gap-1">
        <span className="flex items-center gap-1.5">
          <CloudDownload className="size-3.5" /> {t("sttDownloading", { p: progress })}
          {totalMb ? <span className="text-faint">· {t("sttOneTime", { mb: totalMb })}</span> : null}
        </span>
        <span className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.span className="block h-full rounded-full bg-foreground" animate={{ width: `${progress}%` }} transition={{ ease: "easeOut" }} />
        </span>
      </span>
    );
  } else if (mine && status === "processing") {
    content = (
      <>
        <AudioLines className="size-3.5 animate-pulse" /> {t("sttTranscribing")}
      </>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {content && (
        <motion.p
          key="stt"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}
          aria-live="polite"
        >
          {content}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
