"use client";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToastStore } from "@/stores/toast-store";
import { useT } from "@/lib/i18n";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const { isUr, dir } = useT();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[1000] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg px-4 py-3 text-left shadow-lg border border-border ${
            t.kind === "error" ? "bg-red-50 text-red-900" : t.kind === "success" ? "bg-emerald-50 text-emerald-900" : "bg-card text-ink"
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
        </button>
      ))}
    </div>
  );
}
