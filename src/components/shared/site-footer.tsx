"use client";
import Link from "next/link";
import { LogoMark } from "@/components/shared/logo";
import { useT } from "@/lib/i18n";

const REPO = "https://github.com/Abdullah-Developer68/roshan-rozgar";

export function SiteFooter() {
  const { t } = useT();
  const cols = [
    {
      title: t("footProduct"),
      links: [
        { href: "/customer", label: t("findWorkers") },
        { href: "/worker/join", label: t("landWorkerTitle") },
        { href: "/customer/jobs", label: t("myJobs") },
      ],
    },
    {
      title: t("footProject"),
      links: [
        { href: REPO, label: t("footSource") },
        { href: `${REPO}#readme`, label: "README" },
        { href: "/#demo", label: t("navDemo") },
      ],
    },
  ];
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-10">
      <div className="section-rule grid gap-10 pt-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex items-center gap-2 self-start text-muted-foreground">
          <LogoMark className="size-6 opacity-60" />
          <span className="text-xl font-medium tracking-tight">{t("brand")}</span>
        </div>
        {cols.map((c) => (
          <div key={c.title} className="flex flex-col gap-1.5 text-[13px]">
            <p className="mb-1 font-medium">{c.title}</p>
            {c.links.map((l) => (
              <Link key={l.label} href={l.href} className="text-muted-foreground hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <p className="eyebrow mt-12">
        {t("footHackathon")} · {t("footNote")}
      </p>
    </footer>
  );
}
