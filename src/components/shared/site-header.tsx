"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LangToggle } from "@/components/ui/lang-toggle";
import { Logo } from "@/components/shared/logo";
import { useSessionStore } from "@/stores/session-store";
import { useT } from "@/lib/i18n";

/** Marketing navigation: thin bar, small links, outline + solid CTA. */
export function SiteHeader() {
  const { t } = useT();
  const me = useSessionStore((s) => s.me);
  const load = useSessionStore((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);
  const home = me?.worker ? "/worker" : me?.user ? "/customer" : null;
  return (
    <header className="sticky top-0 z-[600] border-b border-hairline bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden items-center gap-5 text-[13px] text-foreground/80 md:flex">
          <a href="#how" className="hover:text-foreground">{t("navHow")}</a>
          <a href="#trust" className="hover:text-foreground">{t("navTrust")}</a>
          <Link href="/worker/join" className="hover:text-foreground">{t("navWorkers")}</Link>
          <a href="#demo" className="hover:text-foreground">{t("navDemo")}</a>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <LangToggle />
          {home ? (
            <Button asChild size="sm" className="h-8 rounded-lg px-3">
              <Link href={home}>{me?.worker ? t("roleWorker") : t("myJobs")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="hidden h-8 rounded-lg px-3 sm:inline-flex">
                <Link href="/customer">{t("logIn")}</Link>
              </Button>
              <Button asChild size="sm" className="h-8 rounded-lg px-3">
                <Link href="/customer">{t("getStarted")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
