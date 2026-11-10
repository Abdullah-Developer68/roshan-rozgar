"use client";
import { Banknote, CalendarDays, Check, LocateFixed, MapPin, Mic, Pencil, User, Wrench, type LucideIcon } from "lucide-react";
import { TRADE_ICONS, TradeIcon } from "@/components/ui/icons";
import type { ReactNode } from "react";
import { useOnboardingStore, type FixField } from "@/stores/onboarding-store";
import { MicButton } from "@/components/ui/mic-button";
import { SpeakButton, useAutoSpeak } from "@/components/ui/speak-button";
import { PriceStepper } from "@/components/ui/price-stepper";
import { AiBadge } from "@/components/ui/ai-badge";
import { Spinner } from "@/components/ui/spinner";
import { TRADES, TRADE_LIST } from "@/lib/trades";
import { AREAS, AREA_BY_ID } from "@/lib/areas";
import { P, profileSentence } from "@/lib/phrases";
import { useT } from "@/lib/i18n";
import { SttStatus } from "@/components/ui/stt-status";

function cleanName(text: string): string {
  return text
    .replace(/^(mera naam|mera nam|my name is|میرا نام)\s*/i, "")
    .replace(/\s*(hai|ہے|ہیں)\.?$/i, "")
    .trim()
    .slice(0, 60);
}

/** One profile field as a big tappable card. Generic UI primitive (props allowed). */
function FieldCard({
  field,
  icon,
  label,
  value,
  speakUr,
  speakEn,
  children,
}: {
  field: Exclude<FixField, null>;
  icon: LucideIcon;
  label: string;
  value: ReactNode | null;
  speakUr: string | null;
  speakEn: string | null;
  children: ReactNode;
}) {
  const fixing = useOnboardingStore((s) => s.fixing);
  const setFixing = useOnboardingStore((s) => s.setFixing);
  const { t, pick } = useT();
  const open = fixing === field;
  const Icon = icon;
  const missing = value == null;
  return (
    <div className={`rounded-xl bg-card shadow-sm ring-1 ${missing ? "ring-2 ring-red-300" : "ring-line"}`}>
      <div className="flex items-center gap-3 p-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted" aria-hidden>
          <Icon className="size-6" strokeWidth={1.6} />
        </span>
        <button className="flex min-w-0 flex-1 flex-col items-start text-start" onClick={() => setFixing(open ? null : field)}>
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="w-full truncate text-xl font-bold">
            {missing ? <span className="text-base font-normal text-red-700">{pick(P.missing.en, P.missing.ur)}</span> : value}
          </span>
        </button>
        {(speakUr || speakEn) && <SpeakButton ur={speakUr} en={speakEn} size="sm" />}
        <button
          aria-label={t("edit")}
          onClick={() => setFixing(open ? null : field)}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${open ? "bg-brand text-white" : "bg-zinc-100"}`}
        >
          <Pencil className="size-5" />
        </button>
      </div>
      {open && <div className="border-t border-line p-3">{children}</div>}
    </div>
  );
}

function NameFix() {
  const setField = useOnboardingStore((s) => s.setField);
  const setFixing = useOnboardingStore((s) => s.setFixing);
  const name = useOnboardingStore((s) => s.draft.name);
  const { t } = useT();
  return (
    <div className="flex flex-col gap-2">
    <div className="flex items-center gap-3">
      <MicButton
        id="fix-name"
        size="md"
        onDone={(r) => {
          const n = cleanName(r.text);
          if (!n) return;
          if (/[؀-ۿ]/.test(n)) setField("nameUr", n);
          else setField("name", n);
          setFixing(null);
        }}
      />
      <input
        dir="auto"
        value={name}
        onChange={(e) => setField("name", e.target.value)}
        placeholder={t("name")}
        className="min-w-0 flex-1 rounded-lg bg-bg px-3 py-3 text-lg outline-none border border-border"
      />
    </div>
    <SttStatus ownerId="fix-name" />
    </div>
  );
}

function TradeFix() {
  const trade = useOnboardingStore((s) => s.draft.trade);
  const setField = useOnboardingStore((s) => s.setField);
  const setFixing = useOnboardingStore((s) => s.setFixing);
  const { pick } = useT();
  return (
    <div className="grid grid-cols-4 gap-2">
      {TRADE_LIST.map((tr) => (
        <button
          key={tr.id}
          onClick={() => {
            setField("trade", tr.id);
            setFixing(null);
          }}
          className={`flex flex-col items-center rounded-lg p-2 ${trade === tr.id ? "bg-brand text-white" : "bg-bg"}`}
        >
          <TradeIcon trade={tr.id} className="size-7" />
          <span className="text-xs">{pick(tr.en, tr.ur)}</span>
        </button>
      ))}
    </div>
  );
}

function YearsFix() {
  const years = useOnboardingStore((s) => s.draft.experienceYears);
  const setField = useOnboardingStore((s) => s.setField);
  const { t } = useT();
  return (
    <div className="flex items-center justify-between" dir="ltr">
      <button className="size-14 rounded-lg bg-brand/10 text-3xl font-bold text-brand" onClick={() => setField("experienceYears", Math.max(0, (years ?? 1) - 1))}>
        −
      </button>
      <span className="text-4xl font-black tabular-nums">
        {years ?? 0} <span className="text-lg font-normal">{t("years")}</span>
      </span>
      <button className="size-14 rounded-lg bg-brand/10 text-3xl font-bold text-brand" onClick={() => setField("experienceYears", (years ?? 0) + 1)}>
        +
      </button>
    </div>
  );
}

function AreaFix() {
  const areaId = useOnboardingStore((s) => s.draft.areaId);
  const setField = useOnboardingStore((s) => s.setField);
  const setFixing = useOnboardingStore((s) => s.setFixing);
  const locateMe = useOnboardingStore((s) => s.locateMe);
  const locating = useOnboardingStore((s) => s.locating);
  const { t, isUr } = useT();
  return (
    <div className="flex flex-col gap-3">
      <button onClick={() => void locateMe()} className="flex h-14 items-center justify-center gap-2 rounded-lg bg-brand text-white">
        {locating ? <Spinner /> : <LocateFixed className="size-6" />}
        <span className="text-lg">{t("takeLocation")}</span>
      </button>
      <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto">
        {AREAS.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setField("areaId", a.id);
              setField("lat", null);
              setField("lng", null);
              setFixing(null);
            }}
            className={`rounded-lg px-2 py-1.5 text-sm ${areaId === a.id ? "bg-brand text-white" : "bg-bg"}`}
          >
            <span className="block font-semibold font-sans" dir="ltr">{a.en}</span>
            {isUr && <span className="urdu block text-xs leading-6" lang="ur">{a.ur}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChargeFix() {
  const fee = useOnboardingStore((s) => s.draft.visitCharge);
  const setField = useOnboardingStore((s) => s.setField);
  return <PriceStepper value={fee ?? 500} onChange={(n) => setField("visitCharge", n)} />;
}

export function ReviewStep() {
  const draft = useOnboardingStore((s) => s.draft);
  const source = useOnboardingStore((s) => s.source);
  const setStep = useOnboardingStore((s) => s.setStep);
  const setFixing = useOnboardingStore((s) => s.setFixing);
  const missing = useOnboardingStore((s) => s.missing)();
  const { t, pick, lang } = useT();
  useAutoSpeak(P.review);

  const trade = draft.trade ? TRADES[draft.trade] : null;
  const area = draft.areaId ? AREA_BY_ID[draft.areaId] : null;
  const displayName = pick(draft.name, draft.nameUr);
  const sentence = (l: "en" | "ur") =>
    profileSentence(l, {
      name: displayName,
      tradeUr: trade?.ur ?? null,
      tradeEn: trade?.en ?? null,
      years: draft.experienceYears,
      areaUr: area?.ur ?? null,
      areaEn: area?.en ?? null,
      fee: draft.visitCharge,
    });

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("profileTitle")}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("profileSub")}</span>
            <AiBadge source={source} />
          </div>
        </div>
        <SpeakButton ur={sentence("ur") || P.review.ur} en={sentence("en") || P.review.en} size="lg" label={t("readProfile")} />
      </div>

      <FieldCard
        field="name"
        icon={User}
        label={t("name")}
        value={displayName || null}
        speakUr={displayName ? `آپ کا نام ${displayName} ہے` : null}
        speakEn={displayName ? `Your name is ${displayName}` : null}
      >
        <NameFix />
      </FieldCard>
      <FieldCard
        field="trade"
        icon={trade ? TRADE_ICONS[trade.id] : Wrench}
        label={t("work")}
        value={trade ? pick(trade.en, trade.ur) : null}
        speakUr={trade ? `آپ کا کام ${trade.ur} ہے` : null}
        speakEn={trade ? `Your work: ${trade.en}` : null}
      >
        <TradeFix />
      </FieldCard>
      <FieldCard
        field="experience"
        icon={CalendarDays}
        label={t("experience")}
        value={draft.experienceYears != null ? `${draft.experienceYears} ${t("years")}` : null}
        speakUr={draft.experienceYears != null ? `${draft.experienceYears} سال کا تجربہ` : null}
        speakEn={draft.experienceYears != null ? `${draft.experienceYears} years of experience` : null}
      >
        <YearsFix />
      </FieldCard>
      <FieldCard
        field="area"
        icon={MapPin}
        label={t("area")}
        value={area ? (lang === "ur" ? `${area.ur} · ${area.en}` : `${area.en}, ${area.city}`) : null}
        speakUr={area ? `علاقہ ${area.ur}` : null}
        speakEn={area ? `Area ${area.en}` : null}
      >
        <AreaFix />
      </FieldCard>
      <FieldCard
        field="charge"
        icon={Banknote}
        label={t("visitFee")}
        value={draft.visitCharge != null ? <span dir="ltr">Rs {draft.visitCharge.toLocaleString("en-PK")}</span> : null}
        speakUr={draft.visitCharge != null ? `آنے کی فیس ${draft.visitCharge} روپے` : null}
        speakEn={draft.visitCharge != null ? `Visit fee ${draft.visitCharge} rupees` : null}
      >
        <ChargeFix />
      </FieldCard>

      {draft.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5" dir="ltr">
          {draft.skills.map((s) => (
            <span key={s} className="rounded-full bg-card px-3 py-1 text-xs font-medium border border-border">{s}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <button
          onClick={() => {
            if (missing.length) {
              const f = missing[0];
              setFixing(f === "name" ? "name" : f === "trade" ? "trade" : f === "experienceYears" ? "experience" : f === "areaId" ? "area" : "charge");
              return;
            }
            setStep("photo");
          }}
          className={`flex h-20 items-center justify-center gap-3 rounded-xl text-white shadow-sm active:scale-[0.98] ${missing.length ? "bg-zinc-400" : "bg-ok"}`}
        >
          <Check className="size-10" strokeWidth={3} />
          <span className="text-2xl font-bold">{t("allCorrect")}</span>
        </button>
        <button onClick={() => setStep("speak")} className="flex h-12 items-center justify-center gap-2 rounded-lg bg-card border border-border">
          <Mic className="size-5" /> {t("speakAgain")}
        </button>
      </div>
    </div>
  );
}
