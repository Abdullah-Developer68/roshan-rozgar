"use client";
import { AlertTriangle, Camera, LocateFixed, Search, ShieldCheck, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRequestStore } from "@/stores/request-store";
import { useVoiceStore } from "@/stores/voice-store";
import { CustomerShell } from "@/components/customer/customer-shell";
import { WorkerCard } from "@/components/customer/worker-card";
import { MicButton } from "@/components/ui/mic-button";
import { AiBadge } from "@/components/ui/ai-badge";
import { Spinner } from "@/components/ui/spinner";
import { PriceStepper } from "@/components/ui/price-stepper";
import { AREAS, AREA_BY_ID } from "@/lib/areas";
import { TRADE_LIST, TRADES } from "@/lib/trades";
import { formatPkr } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { SttStatus } from "@/components/ui/stt-status";
import { TradeIcon } from "@/components/ui/icons";
import { Mic } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ease, spring } from "@/components/ui/motion";
import { useT } from "@/lib/i18n";

const WorkerMap = dynamic(() => import("@/components/customer/worker-map").then((m) => m.WorkerMap), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-lg bg-zinc-200" />,
});

function ProblemInput() {
  const text = useRequestStore((s) => s.problemText);
  const setText = useRequestStore((s) => s.setProblemText);
  const photo = useRequestStore((s) => s.photoPreview);
  const uploading = useRequestStore((s) => s.uploadingPhoto);
  const setPhoto = useRequestStore((s) => s.setPhoto);
  const clearPhoto = useRequestStore((s) => s.clearPhoto);
  const runTriage = useRequestStore((s) => s.runTriage);
  const triaging = useRequestStore((s) => s.triaging);
  const listening = useVoiceStore((s) => s.ownerId === "problem");
  const interim = useVoiceStore((s) => s.interim);
  const sttLang = useVoiceStore((s) => s.sttLang);
  const setSttLang = useVoiceStore((s) => s.setSttLang);
  const { t } = useT();

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm border border-border">
      <div>
        <h1 className="display text-3xl">{t("chTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("chSub")}</p>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <MicButton id="problem" size="md" onDone={(r) => r.text && setText(`${text} ${r.text}`.trim())} />
          <button onClick={() => setSttLang(sttLang === "ur-PK" ? "en-US" : "ur-PK")} className="text-[11px] font-semibold text-muted-foreground underline">
            <Mic className="inline size-3" /> {sttLang === "ur-PK" ? "اردو" : "English"}
          </button>
        </div>
        <textarea
          value={listening ? `${text} ${interim}`.trim() : text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          dir="auto"
          placeholder={t("chPlaceholder")}
          className="min-w-0 flex-1 resize-none rounded-lg bg-bg p-3 outline-none border border-border focus:ring-2 focus:ring-brand"
        />
      </div>
      <SttStatus ownerId="problem" />
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-bg px-4 py-2 text-sm font-semibold border border-border">
          {uploading ? <Spinner className="size-4" /> : <Camera className="size-4" />} {photo ? t("changePhoto") : t("addPhoto")}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void setPhoto(f);
            }}
          />
        </label>
        {photo && (
          <span className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Problem" className="size-12 rounded-lg object-cover" />
            <button onClick={clearPhoto} aria-label={t("removePhoto")} className="absolute -end-2 -top-2 rounded-full bg-card p-1 shadow">
              <Trash2 className="size-3" />
            </button>
          </span>
        )}
        <Button onClick={() => void runTriage()} disabled={triaging || uploading} size="lg" className="ms-auto">
          {triaging ? <Spinner /> : <Search className="size-4" />} {t("findWorkers")}
        </Button>
      </div>
      <LocationRow />
    </section>
  );
}

function LocationRow() {
  const areaId = useRequestStore((s) => s.areaId);
  const setArea = useRequestStore((s) => s.setArea);
  const locateMe = useRequestStore((s) => s.locateMe);
  const locating = useRequestStore((s) => s.locating);
  const locSource = useRequestStore((s) => s.locSource);
  const addressNote = useRequestStore((s) => s.addressNote);
  const setAddressNote = useRequestStore((s) => s.setAddressNote);
  const { t } = useT();
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <button onClick={() => void locateMe()} className="flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand/10 px-3 text-sm font-semibold text-brand">
          {locating ? <Spinner className="size-4" /> : <LocateFixed className="size-4" />} {locSource === "gps" ? t("usingGps") : t("useMyLocation")}
        </button>
        <select
          value={areaId}
          onChange={(e) => setArea(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-full bg-bg px-3 text-sm border border-border"
          dir="ltr"
          aria-label={t("area")}
        >
          {(["Islamabad", "Rawalpindi"] as const).map((city) => (
            <optgroup key={city} label={city}>
              {AREAS.filter((a) => a.city === city).map((a) => (
                <option key={a.id} value={a.id}>{a.en}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <input
        value={addressNote}
        onChange={(e) => setAddressNote(e.target.value)}
        placeholder={t("addressPh")}
        className="h-10 min-w-0 flex-1 shrink-0 rounded-full bg-bg px-4 text-sm outline-none border border-border"
      />
    </div>
  );
}

function TriageCard() {
  const triage = useRequestStore((s) => s.triage);
  const source = useRequestStore((s) => s.triageSource);
  const stats = useRequestStore((s) => s.priceStats);
  const trade = useRequestStore((s) => s.trade);
  const setTrade = useRequestStore((s) => s.setTrade);
  const { t, pick, isUr } = useT();
  if (!triage) return null;
  const tipEn = triage.safetyTipEn;
  const tip = pick(triage.safetyTipEn, triage.safetyTipUr);
  return (
    <motion.section
      key={triage.summaryEn}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm border border-border"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">
          {trade ? (
            <span className="inline-flex items-center gap-1.5">
              {t("youNeed", { trade: "" })} <TradeIcon trade={trade} className="size-4" /> {pick(TRADES[trade].en, TRADES[trade].ur)}
            </span>
          ) : (
            t("whichWorker")
          )}
        </h2>
        <AiBadge source={source} />
      </div>
      {pick(triage.summaryEn, triage.summaryUr) && <p className="text-sm">{pick(triage.summaryEn, triage.summaryUr)}</p>}
      {!isUr && triage.summaryUr && (
        <div className="rounded-lg bg-bg px-3 py-1">
          <p className="text-[11px] font-semibold text-muted-foreground">{t("workerHears")}</p>
          <p className="urdu text-base" dir="rtl" lang="ur">{triage.summaryUr}</p>
        </div>
      )}
      {triage.urgency === "urgent" && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span><b>{t("urgent")}</b> {tip}</span>
        </p>
      )}
      {triage.urgency !== "urgent" && (tipEn || tip) && (
        <p className="flex items-start gap-2 rounded-lg bg-sun-soft p-3 text-sm text-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" /> {tip}
        </p>
      )}
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        {triage.estimateMin != null && (
          <div className="rounded-lg bg-bg p-3">
            <p className="text-xs text-muted-foreground">{t("aiEstimate")}</p>
            <p className="font-semibold" dir="ltr">{formatPkr(triage.estimateMin)} – {formatPkr(triage.estimateMax)}</p>
          </div>
        )}
        {stats && stats.count > 0 && (
          <div className="rounded-lg bg-bg p-3">
            <p className="text-xs text-muted-foreground">{t("paidOnPlatform", { n: stats.count })}</p>
            <p className="font-semibold">
              <span dir="ltr">{formatPkr(stats.p25)} – {formatPkr(stats.p75)}</span>{" "}
              <span className="font-normal text-muted-foreground">· {t("median")} <span dir="ltr">{formatPkr(stats.median)}</span></span>
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TRADE_LIST.map((tr) => (
          <button
            key={tr.id}
            onClick={() => setTrade(tr.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${trade === tr.id ? "bg-brand text-white" : "bg-bg border border-border"}`}
          >
            <TradeIcon trade={tr.id} className="me-1 inline size-3.5" /> {pick(tr.en, tr.ur)}
          </button>
        ))}
      </div>
    </motion.section>
  );
}

function Results() {
  const results = useRequestStore((s) => s.results);
  const searching = useRequestStore((s) => s.searching);
  const radiusKm = useRequestStore((s) => s.radiusKm);
  const setRadius = useRequestStore((s) => s.setRadius);
  const areaId = useRequestStore((s) => s.areaId);
  const { t } = useT();
  if (searching && !results)
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-8 text-brand" />
      </div>
    );
  if (!results) return null;
  const available = results.filter((w) => w.availability === "available");
  const unavailable = results.filter((w) => w.availability !== "available");
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="lg:sticky lg:top-4 lg:self-start">
        <WorkerMap />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("withinKm", { km: radiusKm, area: AREA_BY_ID[areaId]?.en ?? "" })}</span>
          <span className="flex gap-1" dir="ltr">
            {[4, 8, 15].map((r) => (
              <button key={r} onClick={() => setRadius(r)} className={`rounded-full px-2 py-0.5 ${r === radiusKm ? "bg-brand text-white" : "bg-card border border-border"}`}>
                {r} km
              </button>
            ))}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          {t("availableNow", { n: available.length })} {searching && <Spinner className="size-4" />}
        </h2>
        {available.length === 0 && (
          <p className="rounded-lg bg-card p-4 text-sm border border-border">{t("noneFree")}</p>
        )}
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false} mode="popLayout">
            {available.map((w) => (
              <WorkerCard key={w.id} worker={w} />
            ))}
          </AnimatePresence>
        </ul>
        {unavailable.length > 0 && (
          <>
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">{t("busyOffline", { n: unavailable.length })}</h3>
            <ul className="flex flex-col gap-2">
              <AnimatePresence initial={false} mode="popLayout">
                {unavailable.map((w) => (
                  <WorkerCard key={w.id} worker={w} />
                ))}
              </AnimatePresence>
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function SendBar() {
  const selected = useRequestStore((s) => s.selected);
  const offer = useRequestStore((s) => s.offerAmount);
  const setOffer = useRequestStore((s) => s.setOffer);
  const sending = useRequestStore((s) => s.sending);
  const send = useRequestStore((s) => s.sendRequests);
  const reset = useRequestStore((s) => s.reset);
  const router = useRouter();
  const { t, dir, langClass } = useT();
  return (
    <AnimatePresence>
    {selected.length > 0 && (
    <motion.div
      key="sendbar"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={spring}
      dir={dir}
      className={`fixed inset-x-0 bottom-0 z-[500] ${langClass} border-t border-border bg-card/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur`}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center">
        <div className="sm:w-72">
          <p className="text-xs font-semibold text-muted-foreground">{t("openingOffer")}</p>
          <PriceStepper value={offer ?? 1000} onChange={setOffer} />
        </div>
        <button
          disabled={sending}
          onClick={async () => {
            const ids = await send();
            if (ids?.length) {
              reset();
              router.push(ids.length === 1 ? `/customer/jobs/${ids[0]}` : "/customer/jobs");
            }
          }}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-lg bg-brand text-lg font-semibold text-white disabled:opacity-60"
        >
          {sending ? <Spinner /> : t("sendRequest", { n: selected.length }).replace("(s)", selected.length > 1 ? "s" : "")}
        </button>
      </div>
    </motion.div>
    )}
    </AnimatePresence>
  );
}

export function CustomerHomeScreen() {
  return (
    <CustomerShell>
      <ProblemInput />
      <TriageCard />
      <Results />
      <SendBar />
    </CustomerShell>
  );
}
