import Link from "next/link";
import type { ReactNode } from "react";

/** Mobile frame for worker screens: RTL, Urdu-first, big touch targets. */
export function WorkerShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pb-10 pt-4">
      <header className="flex items-center justify-between" dir="rtl">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-lg">🪔</span>
          <span className="urdu text-xl font-bold text-brand" lang="ur">روشن روزگار</span>
        </Link>
        <span className="text-xs font-semibold text-muted" dir="ltr">Worker</span>
      </header>
      {children}
    </div>
  );
}
