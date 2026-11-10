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
import { useT } from "@/lib/i18n";

const WorkerMap = dynamic(() => import("@/components/customer/worker-map").then((m) => m.WorkerMap), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-zinc-200" />,
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
    <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
      <div>
        <h1 className="text-xl font-bold">{t("chTitle")}</h1>
        <p className="text-sm text-muted">{t("chSub")}</p>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <MicButton id="problem" size="md" onDone={(r) => r.text && setText(`${text} ${r.text}`.trim())} />
          <button onClick={() => setSttLang(sttLang === "ur-PK" ? "en-US" : "ur-PK")} className="text-[11px] font-semibold text-muted underline">
            🎤 {sttLang === "ur-PK" ? "اردو" : "English"}
          </button>
        </div>
        <textarea
          value={listening ? `${text} ${interim}`.trim() : text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          dir="auto"
          placeholder={t("chPlaceholder")}
          className="min-w-0 flex-1 resize-none rounded-2xl bg-bg p-3 outline-none ring-1 ring-line focus:ring-2 focus:ring-brand"
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-bg px-4 py-2 text-sm font-semibold ring-1 ring-line">
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
            <img src={photo} alt="Problem" className="size-12 rounded-xl object-cover" />
            <button onClick={clearPhoto} aria-label={t("removePhoto")} className="absolute -end-2 -top-2 rounded-full bg-white p-1 shadow">
              <Trash2 className="size-3" />
            </button>
          </span>
        )}
        <button
          onClick={() => void runTriage()}
          disabled={triaging || uploading}
          className="ms-auto flex h-11 items-center gap-2 rounded-2xl bg-brand px-5 font-semibold text-white disabled:opacity-60"
        >
          {triaging ? <Spinner /> : <Search className="size-4" />} {t("findWorkers")}
        </button>
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
          className="h-10 min-w-0 flex-1 rounded-full bg-bg px-3 text-sm ring-1 ring-line"
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
        className="h-10 min-w-0 flex-1 shrink-0 rounded-full bg-bg px-4 text-sm outline-none ring-1 ring-line"
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
    <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">
          {trade ? t("youNeed", { trade: `${TRADES[trade].emoji} ${pick(TRADES[trade].en, TRADES[trade].ur)}` }) : t("whichWorker")}
        </h2>
        <AiBadge source={source} />
      </div>
      {pick(triage.summaryEn, triage.summaryUr) && <p className="text-sm">{pick(triage.summaryEn, triage.summaryUr)}</p>}
      {!isUr && triage.summaryUr && (
        <div className="rounded-2xl bg-bg px-3 py-1">
          <p className="text-[11px] font-semibold text-muted">{t("workerHears")}</p>
          <p className="urdu text-base" dir="rtl" lang="ur">{triage.summaryUr}</p>
        </div>
      )}
      {triage.urgency === "urgent" && (
        <p className="flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span><b>{t("urgent")}</b> {tip}</span>
        </p>
      )}
      {triage.urgency !== "urgent" && (tipEn || tip) && (
        <p className="flex items-start gap-2 rounded-2xl bg-sun-soft p-3 text-sm text-amber-900">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" /> {tip}
        </p>
      )}
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        {triage.estimateMin != null && (
          <div className="rounded-2xl bg-bg p-3">
            <p className="text-xs text-muted">{t("aiEstimate")}</p>
            <p className="font-bold" dir="ltr">{formatPkr(triage.estimateMin)} – {formatPkr(triage.estimateMax)}</p>
          </div>
        )}
        {stats && stats.count > 0 && (
          <div className="rounded-2xl bg-bg p-3">
            <p className="text-xs text-muted">{t("paidOnPlatform", { n: stats.count })}</p>
            <p className="font-bold">
              <span dir="ltr">{formatPkr(stats.p25)} – {formatPkr(stats.p75)}</span>{" "}
              <span className="font-normal text-muted">· {t("median")} <span dir="ltr">{formatPkr(stats.median)}</span></span>
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TRADE_LIST.map((tr) => (
          <button
            key={tr.id}
            onClick={() => setTrade(tr.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${trade === tr.id ? "bg-brand text-white" : "bg-bg ring-1 ring-line"}`}
          >
            {tr.emoji} {pick(tr.en, tr.ur)}
          </button>
        ))}
      </div>
    </section>
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
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>{t("withinKm", { km: radiusKm, area: AREA_BY_ID[areaId]?.en ?? "" })}</span>
          <span className="flex gap-1" dir="ltr">
            {[4, 8, 15].map((r) => (
              <button key={r} onClick={() => setRadius(r)} className={`rounded-full px-2 py-0.5 ${r === radiusKm ? "bg-brand text-white" : "bg-white ring-1 ring-line"}`}>
                {r} km
              </button>
            ))}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-bold">
          {t("availableNow", { n: available.length })} {searching && <Spinner className="size-4" />}
        </h2>
        {available.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-sm ring-1 ring-line">{t("noneFree")}</p>
        )}
        <ul className="flex flex-col gap-3">
          {available.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </ul>
        {unavailable.length > 0 && (
          <>
            <h3 className="mt-2 text-sm font-semibold text-muted">{t("busyOffline", { n: unavailable.length })}</h3>
            <ul className="flex flex-col gap-2">
              {unavailable.map((w) => (
                <WorkerCard key={w.id} worker={w} />
              ))}
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
  if (!selected.length) return null;
  return (
    <div dir={dir} className={`fixed inset-x-0 bottom-0 z-[500] ${langClass} border-t border-line bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur`}>
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center">
        <div className="sm:w-72">
          <p className="text-xs font-semibold text-muted">{t("openingOffer")}</p>
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
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-white disabled:opacity-60"
        >
          {sending ? <Spinner /> : t("sendRequest", { n: selected.length }).replace("(s)", selected.length > 1 ? "s" : "")}
        </button>
      </div>
    </div>
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
