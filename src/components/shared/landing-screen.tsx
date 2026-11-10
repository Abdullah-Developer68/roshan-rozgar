"use client";
import { BadgeCheck, Languages, MapPinned, Mic, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DemoPanel } from "@/components/shared/demo-panel";
import { LangToggle } from "@/components/ui/lang-toggle";
import { useT, type MsgKey } from "@/lib/i18n";

const STEPS: { icon: typeof Mic; title: MsgKey; text: MsgKey }[] = [
  { icon: Mic, title: "step1T", text: "step1" },
  { icon: MapPinned, title: "step2T", text: "step2" },
  { icon: Languages, title: "step3T", text: "step3" },
  { icon: ShieldCheck, title: "step4T", text: "step4" },
  { icon: BadgeCheck, title: "step5T", text: "step5" },
];

export function LandingScreen() {
  const { t, dir, langClass, lang, isUr } = useT();
  return (
    <main className={`mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-6 ${langClass}`} dir={dir} lang={lang}>
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-xl">🪔</span>
          <span className="text-xl font-bold text-brand">{t("brand")}</span>
          {!isUr && <span className="urdu hidden text-xl text-brand min-[420px]:inline" lang="ur">· روشن روزگار</span>}
        </div>
        <LangToggle />
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/worker/join"
          className="group flex min-h-56 flex-col justify-between rounded-[2rem] bg-brand p-6 text-white shadow-xl transition active:scale-[0.99]"
        >
          <span className="text-6xl" aria-hidden>🧰</span>
          <span>
            <span className="block text-4xl font-bold">{t("landWorkerTitle")}</span>
            <span className="block text-lg text-white/85">{t("landWorkerSub")}</span>
            {!isUr && (
              <span className="urdu mt-1 block text-lg text-white/80" lang="ur" dir="rtl">میں کاریگر ہوں</span>
            )}
          </span>
        </Link>
        <Link
          href="/customer"
          className="flex min-h-56 flex-col justify-between rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-line transition active:scale-[0.99]"
        >
          <span className="text-6xl" aria-hidden>🏠</span>
          <span>
            <span className="block text-3xl font-bold">{t("landCustomerTitle")}</span>
            <span className="block text-muted">{t("landCustomerSub")}</span>
          </span>
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-3xl bg-white p-4 ring-1 ring-line">
            <s.icon className="mb-2 size-6 text-brand" />
            <h3 className="font-semibold">{t(s.title)}</h3>
            <p className="text-sm text-muted">{t(s.text)}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-sun-soft p-5 ring-1 ring-amber-200">
          <h2 className="mb-1 font-bold">{t("demoTitle")}</h2>
          <p className="mb-3 text-sm text-amber-950/80">{t("demoText")}</p>
          <DemoPanel />
        </div>
        <div className="rounded-3xl bg-white p-5 text-sm ring-1 ring-line">
          <h2 className="mb-2 font-bold">{t("realTitle")}</h2>
          <ul className="list-disc space-y-1 ps-5 text-muted">
            <li><b className="text-ink">{t("realL")}</b> {t("real")}</li>
            <li><b className="text-ink">{t("simL")}</b> {t("sim")}</li>
            <li><b className="text-ink">{t("oosL")}</b> {t("oos")}</li>
            <li>{t("quota")}</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
