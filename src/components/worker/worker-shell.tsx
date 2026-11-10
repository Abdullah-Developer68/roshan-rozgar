"use client";
import type { ReactNode } from "react";
import { LangToggle } from "@/components/ui/lang-toggle";
import { Logo } from "@/components/shared/logo";
import { useT } from "@/lib/i18n";

/** Mobile frame for worker screens: big touch targets, Urdu or English per the language switch. */
export function WorkerShell({ children }: { children: ReactNode }) {
  const { t, dir, langClass, lang } = useT();
  return (
    <div className={`flex flex-1 flex-col ${langClass}`} dir={dir} lang={lang}>
      <header className="sticky top-0 z-[600] border-b border-hairline bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-md items-center gap-2 px-4">
          <Logo href="/worker" />
          <span className="hidden rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground min-[400px]:inline">
            {t("roleWorker")}
          </span>
          <LangToggle className="ms-auto" />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pb-10 pt-5">{children}</div>
    </div>
  );
}
