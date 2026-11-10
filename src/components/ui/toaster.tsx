"use client";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { spring } from "@/components/ui/motion";
import { useToastStore } from "@/stores/toast-store";
import { useT } from "@/lib/i18n";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const { isUr, dir } = useT();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[1000] flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence initial={false}>
      {toasts.map((t) => (
        <motion.button
          key={t.id}
          layout
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.15 } }}
          transition={spring}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-start shadow-[0_12px_32px_-12px_rgba(10,10,10,0.25)] ${
            t.kind === "error" ? "border-red-200 bg-red-50 text-red-900" : t.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-border bg-card text-foreground"
          }`}
        >
          {t.kind === "error" ? <XCircle className="mt-0.5 size-5 shrink-0" /> : t.kind === "success" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0" /> : <Info className="mt-0.5 size-5 shrink-0" />}
          <span className="flex flex-col" dir={dir}>
            {isUr && t.textUr ? (
              <span className="urdu text-base" lang="ur">{t.textUr}</span>
            ) : (
              <span className="text-sm font-medium">{t.text}</span>
            )}
          </span>
        </motion.button>
      ))}
      </AnimatePresence>
    </div>
  );
}
