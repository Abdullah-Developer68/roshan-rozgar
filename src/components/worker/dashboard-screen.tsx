"use client";
import { Bell, Check, CheckCheck, LogOut, Moon, MapPin, MessageCircle, Navigation, Phone, Power, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { listItem, ease } from "@/components/ui/motion";
import { useSessionStore } from "@/stores/session-store";
import { useWorkerDashStore } from "@/stores/worker-dash-store";
import { WorkerShell } from "@/components/worker/worker-shell";
import { SpeakButton } from "@/components/ui/speak-button";
import { Spinner } from "@/components/ui/spinner";
import { Stars } from "@/components/ui/stars";
import { Avatar } from "@/components/ui/avatar";
import { AiBadge } from "@/components/ui/ai-badge";
import { TradeIcon } from "@/components/ui/icons";
import { AREA_BY_ID } from "@/lib/areas";
import { P } from "@/lib/phrases";
import { useT } from "@/lib/i18n";
import type { JobDTO } from "@/lib/types";
import { api } from "@/lib/client/api";
import { toast } from "@/stores/toast-store";

function useTimeAgo() {
  const { t } = useT();
  return (iso: string) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    return m < 1 ? t("justNow") : m < 60 ? t("minAgo", { n: m }) : t("hoursAgo", { n: Math.round(m / 60) });
  };
}

function AvailabilitySwitch() {
  const worker = useWorkerDashStore((s) => s.worker);
  const toggling = useWorkerDashStore((s) => s.toggling);
  const toggleOnline = useWorkerDashStore((s) => s.toggleOnline);
  const { t } = useT();
  if (!worker) return null;
  const busy = worker.availability === "busy";
  const on = worker.isOnline;
  const phrase = busy ? P.busy : on ? P.online : P.offline;
  return (
    <motion.div
      animate={{ backgroundColor: busy ? "#ea580c" : on ? "#16a34a" : "#71717a" }}
      transition={{ duration: 0.4, ease }}
      className="flex items-center gap-3 rounded-xl p-4 text-white shadow-sm"
    >
      <button
        onClick={() => void toggleOnline()}
        disabled={toggling}
        aria-pressed={on}
        aria-label={on ? t("goOffline") : t("goOnline")}
        className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/40 active:scale-95"
      >
        {toggling ? <Spinner className="size-9" /> : (
          <motion.span key={String(on)} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.35, ease }} className="flex">
            <Power className="size-10" strokeWidth={2.5} />
          </motion.span>
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-2xl font-bold">{busy ? t("youAreOnJob") : on ? t("readyForWork") : t("offline")}</span>
        <span className="mt-1 text-xs text-white/85">{busy ? t("subBusy") : on ? t("subOnline") : t("subOffline")}</span>
      </div>
      <SpeakButton ur={phrase.ur} hi={phrase.hi} en={phrase.en} />
    </motion.div>
  );
}

function ActiveJob() {
  const job = useWorkerDashStore((s) => s.active);
  const refresh = useWorkerDashStore((s) => s.refresh);
  const { t, pick } = useT();
  if (!job) return null;
  const area = AREA_BY_ID[job.areaId];
  const sayUr = `${job.customer.name} کا کام۔ ${job.summaryUr ?? ""} قیمت ${job.agreedPrice} روپے۔`;
  const sayEn = `Job for ${job.customer.name}. ${job.summaryEn ?? job.problemText} Price ${job.agreedPrice} rupees.`;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease }}
      className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm ring-2 ring-busy"
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-busy">{t("currentJob")}</span>
        <SpeakButton ur={sayUr} en={sayEn} />
      </div>
      <p className="text-lg">{pick(job.summaryEn, job.summaryUr) || job.problemText}</p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold">{job.customer.name}</span>
        <span className="flex items-center gap-1"><MapPin className="size-4" /> <span dir="ltr">{area?.en}</span></span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800" dir="ltr">Rs {job.agreedPrice?.toLocaleString("en-PK")}</span>
      </div>
      {job.addressNote && <p className="text-sm text-muted-foreground" dir="auto">{job.addressNote}</p>}
      <div className="grid grid-cols-3 gap-2">
        {job.customer.phone && (
          <a href={`tel:${job.customer.phone}`} className="flex h-14 flex-col items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Phone className="size-6" />
            <span className="text-xs">{t("call")}</span>
          </a>
        )}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-14 flex-col items-center justify-center rounded-lg bg-brand/10 text-brand"
        >
          <Navigation className="size-6" />
          <span className="text-xs">{t("route")}</span>
        </a>
        <Link href={`/worker/jobs/${job.id}`} className="flex h-14 flex-col items-center justify-center rounded-lg bg-brand/10 text-brand">
          <MessageCircle className="size-6" />
          <span className="text-xs">{t("chat")}</span>
        </Link>
      </div>
      <button
        onClick={async () => {
          try {
            await api(`/api/jobs/${job.id}/complete`, { method: "POST" });
            toast.success("Job completed", "کام مکمل ہو گیا");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
          }
          void refresh();
        }}
        className="flex h-16 items-center justify-center gap-2 rounded-lg bg-ok text-white shadow active:scale-[0.98]"
      >
        <CheckCheck className="size-8" />
        <span className="text-xl font-bold">{t("jobDone")}</span>
      </button>
    </motion.section>
  );
}

/** One incoming request (list item). */
function RequestCard({ job }: { job: JobDTO }) {
  const decline = useWorkerDashStore((s) => s.decline);
  const router = useRouter();
  const { t, pick } = useT();
  const ago = useTimeAgo();
  const area = AREA_BY_ID[job.areaId];
  const offer = job.pendingOffer;
  const summary = pick(job.summaryEn, job.summaryUr) || job.problemText;
  const sayUr = `نیا کام۔ ${job.summaryUr || job.problemText}۔ ${job.distanceKm ?? ""} کلومیٹر دور۔${offer ? ` گاہک ${offer.amount} روپے دے رہا ہے۔` : ""}`;
  const sayEn = `New job. ${job.summaryEn || job.problemText}. ${job.distanceKm ?? ""} kilometres away.${offer ? ` The customer offers ${offer.amount} rupees.` : ""}`;
  return (
    <motion.li layout {...listItem} className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm border border-border">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted" aria-hidden>
          <TradeIcon trade={job.trade} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg">{summary}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="size-4" /> <span dir="ltr">{area?.en} · {job.distanceKm} km</span></span>
            <span>{job.customer.name}</span>
            <span>{ago(job.createdAt)}</span>
            <AiBadge source={job.triageSource} />
          </div>
        </div>
        <SpeakButton ur={sayUr} en={sayEn} />
      </div>
      {job.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={job.photoUrl} alt="" className="max-h-48 w-full rounded-lg object-cover" />
      )}
      {offer && (
        <div className="flex items-center justify-between rounded-lg bg-sun-soft px-4 py-2 ring-1 ring-border">
          <span className="text-base">{offer.by === "customer" ? t("customersOffer") : t("yourPrice")}</span>
          <span className="text-2xl font-black" dir="ltr">Rs {offer.amount.toLocaleString("en-PK")}</span>
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          onClick={() => router.push(`/worker/jobs/${job.id}`)}
          className="flex h-16 items-center justify-center gap-2 rounded-lg bg-ok text-white active:scale-[0.98]"
        >
          <Check className="size-8" strokeWidth={3} />
          <span className="text-xl font-bold">{t("viewTalk")}</span>
        </button>
        <button
          onClick={() => void decline(job.id)}
          aria-label={t("decline")}
          className="flex size-16 items-center justify-center rounded-lg bg-red-50 text-danger active:scale-95"
        >
          <X className="size-8" strokeWidth={3} />
        </button>
      </div>
    </motion.li>
  );
}

function Requests() {
  const requests = useWorkerDashStore((s) => s.requests);
  const worker = useWorkerDashStore((s) => s.worker);
  const { t } = useT();
  if (!worker) return null;
  if (!requests.length)
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line p-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden>
          {worker.isOnline ? <Bell className="size-7" strokeWidth={1.6} /> : <Moon className="size-7" strokeWidth={1.6} />}
        </span>
        <p className="text-lg">
          {worker.availability === "busy" ? t("emptyBusy") : worker.isOnline ? t("emptyOnline") : t("emptyOffline")}
        </p>
      </div>
    );
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        {t("newJobs")} <span className="rounded-full bg-danger px-2 text-sm text-white" dir="ltr">{requests.length}</span>
      </h2>
      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {requests.map((j) => (
            <RequestCard key={j.id} job={j} />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

function TrustPanel() {
  const worker = useWorkerDashStore((s) => s.worker);
  const signOut = useSessionStore((s) => s.signOut);
  const router = useRouter();
  const { t, pick } = useT();
  if (!worker) return null;
  const summary = pick(worker.trustSummaryEn, worker.trustSummaryUr);
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm border border-border">
      <div className="flex items-center gap-3">
        <Avatar name={worker.name} photoUrl={worker.photoUrl} trade={worker.trade} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{pick(worker.name, worker.nameUr)}</p>
          <div className="flex items-center gap-2 text-sm">
            <Stars value={worker.ratingAvg} />
            <span className="font-semibold" dir="ltr">{worker.ratingAvg ? worker.ratingAvg.toFixed(1) : t("new")}</span>
            <span className="text-muted-foreground">· {t("nJobs", { n: worker.jobsCompleted })}</span>
          </div>
        </div>
        <button
          aria-label={t("signOut")}
          onClick={async () => {
            await signOut();
            router.replace("/");
          }}
          className="flex size-10 items-center justify-center rounded-full bg-zinc-100"
        >
          <LogOut className="size-5" />
        </button>
      </div>
      {summary && (
        <div className="flex items-start gap-2 rounded-lg bg-bg p-3">
          <p className="flex-1 text-base">{summary}</p>
          <SpeakButton ur={worker.trustSummaryUr} en={worker.trustSummaryEn} size="sm" />
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("whatCustomersSee")}</span>
        <AiBadge source={worker.trustSummarySource} />
      </div>
    </section>
  );
}

export function WorkerDashboardScreen() {
  const router = useRouter();
  const me = useSessionStore((s) => s.me);
  const status = useSessionStore((s) => s.status);
  const load = useSessionStore((s) => s.load);
  const loaded = useWorkerDashStore((s) => s.loaded);
  const startPolling = useWorkerDashStore((s) => s.startPolling);

  useEffect(() => {
    void load();
  }, [load]);

  const isWorker = !!me?.worker;
  useEffect(() => {
    if (status === "ready" && !isWorker) router.replace("/worker/join");
  }, [status, isWorker, router]);

  useEffect(() => {
    if (!isWorker) return;
    return startPolling();
  }, [isWorker, startPolling]);

  return (
    <WorkerShell>
      {!loaded ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-10 text-brand" />
        </div>
      ) : (
        <>
          <AvailabilitySwitch />
          <ActiveJob />
          <Requests />
          <TrustPanel />
        </>
      )}
    </WorkerShell>
  );
}
