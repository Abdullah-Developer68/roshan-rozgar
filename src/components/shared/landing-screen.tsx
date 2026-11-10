"use client";
import {
  ArrowRight,
  AudioLines,
  BadgeCheck,
  CheckCheck,
  Languages,
  LockKeyhole,
  MapPinned,
  Mic,
  PhoneOff,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DemoPanel } from "@/components/shared/demo-panel";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { LogoMark } from "@/components/shared/logo";
import { useT, type MsgKey } from "@/lib/i18n";
import { TRADE_LIST } from "@/lib/trades";
import { TradeIcon } from "@/components/ui/icons";
import { motion } from "motion/react";
import { Reveal, Stagger, StaggerItem, ease } from "@/components/ui/motion";

const FEATURES: { icon: typeof Mic; title: MsgKey; text: MsgKey }[] = [
  { icon: Mic, title: "step1T", text: "step1" },
  { icon: MapPinned, title: "step2T", text: "step2" },
  { icon: Languages, title: "step3T", text: "step3" },
  { icon: LockKeyhole, title: "step4T", text: "step4" },
  { icon: BadgeCheck, title: "step5T", text: "step5" },
];

const EMBLEMS: { icon: typeof Mic; key: MsgKey }[] = [
  { icon: BadgeCheck, key: "emblem1" },
  { icon: PhoneOff, key: "emblem2" },
  { icon: ShieldCheck, key: "emblem3" },
];

const TRUST: MsgKey[] = ["trust1", "trust2", "trust3", "trust4", "trust5", "trust6"];

/** Static illustration of the product (job thread + worker card), built from the real design tokens. */
function ProductPreview() {
  const { t, pick } = useT();
  return (
    <div className="relative mx-auto mt-14 w-full max-w-5xl px-2" aria-hidden>
      {/* soft photographic-ish backdrop blocks, like the reference collage */}
      <div className="absolute -top-6 start-2 h-24 w-40 rounded-md bg-[linear-gradient(135deg,#d9dde3,#eef0f2)] opacity-80" />
      <div className="absolute -end-2 top-24 h-40 w-24 rounded-md bg-[linear-gradient(160deg,#c9d3d6,#e9ecec)] opacity-80" />
      <div className="absolute -bottom-6 start-24 h-16 w-48 rounded-md bg-[linear-gradient(120deg,#dfe7ee,#f3f5f7)] opacity-90" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease, delay: 0.25 }}
        className="surface relative grid overflow-hidden shadow-[0_24px_60px_-24px_rgba(10,10,10,0.25)] sm:grid-cols-[180px_1fr]"
      >
        {/* sidebar */}
        <div className="hidden flex-col gap-1 border-e border-border bg-muted/40 p-3 text-[12px] sm:flex">
          <div className="mb-2 flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <p className="eyebrow mb-1">{t("previewJobs")}</p>
          {TRADE_LIST.slice(0, 6).map((tr, i) => (
            <div key={tr.id} className={`flex items-center gap-2 rounded-md px-2 py-1 ${i === 2 ? "bg-card font-medium shadow-sm" : "text-muted-foreground"}`}>
              <TradeIcon trade={tr.id} className="size-3.5" />
              <span className="truncate">{pick(tr.en, tr.ur)}</span>
              {i < 3 && <span className="ms-auto size-1.5 rounded-full bg-info" />}
            </div>
          ))}
        </div>

        {/* thread */}
        <div className="flex min-h-[340px] flex-col gap-3 p-4 text-[13px]">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <TradeIcon trade="ac_technician" className="size-4" />
            <span className="font-medium">{pick("AC not cooling · G-9", "اے سی ٹھنڈا نہیں · جی نائن")}</span>
            <span className="ms-auto rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t("jobStatus_requested")}</span>
          </div>
          <div className="ms-auto max-w-[75%] rounded-lg bg-muted px-3 py-2">{pick(t("previewCustomer"), t("previewCustomer"))}</div>
          <div className="flex max-w-[80%] flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AudioLines className="size-4" />
              <span className="h-1 flex-1 rounded-full bg-muted">
                <span className="block h-1 w-2/3 rounded-full bg-foreground" />
              </span>
              <span>0:06</span>
            </div>
            <p>{t("previewWorkerEn")}</p>
            <p className="flex items-center gap-1 text-[11px] text-ok">
              <CheckCheck className="size-3.5" /> {t("previewTested")}
            </p>
          </div>
          <div className="w-56 rounded-lg border-2 border-foreground bg-card p-3">
            <p className="text-[11px] text-muted-foreground">{t("workersPrice")}</p>
            <p className="text-2xl font-semibold tracking-tight" dir="ltr">Rs 2,000</p>
            <span className="mt-2 flex h-8 items-center justify-center rounded-md bg-ok text-[12px] font-medium text-white">{t("acceptBook")}</span>
          </div>
          <div className="mt-auto flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-muted-foreground">
            <span className="flex-1">{t("typeMessage")}</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-background">
              <Mic className="size-3.5" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* floating worker card */}
      <motion.div
        initial={{ opacity: 0, y: 30, x: 20 }}
        animate={{ opacity: 1, y: [0, -6, 0], x: 0 }}
        transition={{ opacity: { duration: 0.6, delay: 0.7 }, x: { duration: 0.6, delay: 0.7, ease }, y: { duration: 5, delay: 1.3, repeat: Infinity, ease: "easeInOut" } }}
        className="surface absolute -bottom-10 end-0 hidden w-72 p-4 shadow-[0_24px_60px_-24px_rgba(10,10,10,0.3)] md:block"
      >
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-ok">
          <span className="size-1.5 rounded-full bg-ok" /> {t("statusAvailable")}
        </p>
        <p className="mt-1 text-lg font-medium tracking-tight">{pick("Abdul Rehman", "عبدالرحمن")}</p>
        <p className="text-[12px] text-muted-foreground" dir="ltr">AC Technician · 1.2 km · ~8 min</p>
        <div className="mt-2 flex items-center gap-1 text-[12px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="size-3.5 fill-foreground text-foreground" />
          ))}
          <span className="ms-1 font-medium">4.9</span>
          <span className="text-muted-foreground">· {t("jobsDoneHere", { n: 8 })}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {["On time", "Fair price", "Fixed it first time"].map((x) => (
            <span key={x} className="rounded-full border border-border px-2 py-0.5 text-[11px]">{x}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function LandingScreen() {
  const { t, dir, langClass, lang, pick } = useT();
  return (
    <div className={`flex flex-1 flex-col ${langClass}`} dir={dir} lang={lang}>
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-16 sm:pt-24">
          <Stagger gap={0.09}>
          <StaggerItem>
            <h1 className="display max-w-3xl text-[2.6rem] sm:text-6xl">{t("heroTitle")}</h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{t("heroSub")}</p>
          </StaggerItem>
          <StaggerItem className="mt-7 flex flex-wrap gap-2">
            <Button asChild size="lg" className="h-11 rounded-lg px-5">
              <Link href="/customer">
                {t("findWorkers")} <ArrowRight className="rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 rounded-lg px-5">
              <Link href="/worker/join">
                <Mic /> {t("heroJoin")}
              </Link>
            </Button>
          </StaggerItem>
          </Stagger>
          <ProductPreview />
        </section>

        {/* Trades strip (in place of a customer-logo strip) */}
        <section className="section-rule">
          <div className="mx-auto w-full max-w-6xl px-4 py-8">
            <p className="eyebrow mb-5 text-center">{t("stripTitle")}</p>
            <ul className="grid grid-cols-4 gap-y-5 text-muted-foreground sm:grid-cols-8">
              {TRADE_LIST.map((tr) => (
                <li key={tr.id} className="flex flex-col items-center gap-1 grayscale">
                  <TradeIcon trade={tr.id} className="size-6" strokeWidth={1.5} />
                  <span className="text-[13px] font-medium tracking-tight">{pick(tr.en, tr.ur)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works: hairline grid */}
        <section id="how" className="section-rule scroll-mt-16">
          <div className="frame px-4 py-16 sm:px-8">
            <Reveal>
              <h2 className="display text-3xl sm:text-[2.6rem]">
                {t("featA")} <span className="display-faint block">{t("featB")}</span>
              </h2>
            </Reveal>
            <Stagger inView gap={0.07} className="mt-10 grid border-s border-t border-hairline sm:grid-cols-2 lg:grid-cols-5">
              {FEATURES.map((f, i) => (
                <StaggerItem key={f.title} className="flex flex-col gap-3 border-e border-b border-hairline p-5 transition-colors hover:bg-card">
                  <span className="text-[11px] text-faint tabular-nums" dir="ltr">0{i + 1}</span>
                  <f.icon className="size-5" strokeWidth={1.6} />
                  <h3 className="text-[15px] font-medium">{t(f.title)}</h3>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{t(f.text)}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Trust: mirrors the reference "enterprise security" block */}
        <section id="trust" className="section-rule scroll-mt-16">
          <div className="frame grid gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[1fr_2fr]">
            <Reveal>
              <h2 className="display text-3xl sm:text-[2.2rem]">
                {t("trustA")} <span className="display-faint block">{t("trustB")}</span>
              </h2>
            </Reveal>
            <div>
              <Stagger inView gap={0.1} className="grid grid-cols-3 border-s border-hairline">
                {EMBLEMS.map((e) => (
                  <StaggerItem key={e.key} className="flex flex-col items-center gap-3 border-e border-hairline px-2 py-6 text-center">
                    <span className="flex size-16 items-center justify-center rounded-full border border-border text-muted-foreground">
                      <e.icon className="size-7" strokeWidth={1.4} />
                    </span>
                    <span className="text-[12px] text-muted-foreground">{t(e.key)}</span>
                  </StaggerItem>
                ))}
              </Stagger>
              <Reveal delay={0.15} className="mt-6 grid gap-x-8 sm:grid-cols-2">
                {TRUST.map((k) => (
                  <p key={k} className="border-b border-hairline py-3 text-[13px] text-muted-foreground">
                    {t(k)}
                  </p>
                ))}
              </Reveal>
            </div>
          </div>
        </section>

        {/* Demo + honesty */}
        <section id="demo" className="section-rule scroll-mt-16">
          <div className="frame grid gap-px bg-hairline lg:grid-cols-2">
            <div className="bg-background p-6 sm:p-8">
              <p className="eyebrow mb-2">{t("demoTitle")}</p>
              <p className="mb-5 max-w-md text-[14px] text-muted-foreground">{t("demoText")}</p>
              <DemoPanel />
            </div>
            <div className="bg-background p-6 sm:p-8">
              <p className="eyebrow mb-2">{t("realTitle")}</p>
              <ul className="flex flex-col text-[13px] text-muted-foreground">
                {(
                  [
                    ["realL", "real"],
                    ["simL", "sim"],
                    ["oosL", "oos"],
                  ] as [MsgKey, MsgKey][]
                ).map(([l, v]) => (
                  <li key={l} className="border-b border-hairline py-3">
                    <span className="font-medium text-foreground">{t(l)}</span> {t(v)}
                  </li>
                ))}
                <li className="py-3">{t("quota")}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="section-rule">
          <Reveal className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-28 text-center">
            <LogoMark className="mb-6 size-8" />
            <h2 className="display text-4xl sm:text-5xl">
              <span className="display-faint block">{t("ctaA")}</span>
              {t("ctaB")}
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Button asChild size="lg" className="h-10 rounded-lg px-4">
                <Link href="/customer">{t("getStarted")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-10 rounded-lg px-4">
                <Link href="/worker/join">{t("heroJoin")}</Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
