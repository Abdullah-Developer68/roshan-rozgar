"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { LangToggle } from "@/components/ui/lang-toggle";
import { useT } from "@/lib/i18n";

/** Mobile frame for worker screens: big touch targets, Urdu or English per the language switch. */
export function WorkerShell({ children }: { children: ReactNode }) {
  const { t, dir, langClass, lang } = useT();
  return (
    <div className={`mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pb-10 pt-4 ${langClass}`} dir={dir} lang={lang}>
      <header className="flex items-center justify-between gap-2">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-lg">🪔</span>
          <span className="truncate text-xl font-bold text-brand">{t("brand")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-muted min-[440px]:inline">{t("roleWorker")}</span>
          <LangToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
