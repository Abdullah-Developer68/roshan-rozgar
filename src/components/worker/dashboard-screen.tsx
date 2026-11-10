"use client";
import { Check, CheckCheck, LogOut, MapPin, MessageCircle, Navigation, Phone, Power, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSessionStore } from "@/stores/session-store";
import { useWorkerDashStore } from "@/stores/worker-dash-store";
import { WorkerShell } from "@/components/worker/worker-shell";
import { SpeakButton } from "@/components/ui/speak-button";
import { Spinner } from "@/components/ui/spinner";
import { Stars } from "@/components/ui/stars";
import { Avatar } from "@/components/ui/avatar";
import { AiBadge } from "@/components/ui/ai-badge";
import { TRADES } from "@/lib/trades";
import { AREA_BY_ID } from "@/lib/areas";
import { P } from "@/lib/phrases";
import type { JobDTO } from "@/lib/types";
import { api } from "@/lib/client/api";
import { toast } from "@/stores/toast-store";

function minutesAgo(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? "ابھی" : m < 60 ? `${m} منٹ پہلے` : `${Math.round(m / 60)} گھنٹے پہلے`;
}

function AvailabilitySwitch() {
  const worker = useWorkerDashStore((s) => s.worker);
  const toggling = useWorkerDashStore((s) => s.toggling);
  const toggleOnline = useWorkerDashStore((s) => s.toggleOnline);
  if (!worker) return null;
  const busy = worker.availability === "busy";
  const on = worker.isOnline;
  const phrase = busy ? P.busy : on ? P.online : P.offline;
  return (
    <div
      className={`flex items-center gap-3 rounded-3xl p-4 text-white shadow-lg ${busy ? "bg-busy" : on ? "bg-ok" : "bg-zinc-500"}`}
    >
      <button
        onClick={() => void toggleOnline()}
        disabled={toggling}
        aria-pressed={on}
        aria-label={on ? "Go offline" : "Go online"}
        className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/40 active:scale-95"
      >
        {toggling ? <Spinner className="size-9" /> : <Power className="size-10" strokeWidth={2.5} />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="urdu text-2xl font-bold" lang="ur">
          {busy ? "آپ کام پر ہیں" : on ? "کام کے لیے تیار" : "آف لائن"}
        </span>
        <span className="text-xs text-white/80" dir="ltr">
          {busy ? "Engaged on a job — hidden from new customers" : on ? "Customers nearby can find you" : "Hidden from customers"}
        </span>
      </div>
      <SpeakButton ur={phrase.ur} hi={phrase.hi} />
    </div>
  );
}

function ActiveJob() {
  const job = useWorkerDashStore((s) => s.active);
  const refresh = useWorkerDashStore((s) => s.refresh);
  if (!job) return null;
  const area = AREA_BY_ID[job.areaId];
  const say = `${job.customer.name} کا کام۔ ${job.summaryUr ?? ""} قیمت ${job.agreedPrice} روپے۔`;
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-2 ring-busy">
      <div className="flex items-center justify-between">
        <span className="urdu text-lg font-bold text-busy" lang="ur">ابھی کا کام</span>
        <SpeakButton ur={say} />
      </div>
      <p className="urdu text-lg" lang="ur">{job.summaryUr || job.problemText}</p>
      <div className="flex flex-wrap items-center gap-3 text-sm" dir="ltr">
        <span className="font-semibold">{job.customer.name}</span>
        <span className="flex items-center gap-1"><MapPin className="size-4" /> {area?.en}</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">Rs {job.agreedPrice?.toLocaleString("en-PK")}</span>
      </div>
      {job.addressNote && <p className="text-sm text-muted" dir="auto">{job.addressNote}</p>}
      <div className="grid grid-cols-3 gap-2">
        {job.customer.phone && (
          <a href={`tel:${job.customer.phone}`} className="flex h-14 flex-col items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Phone className="size-6" />
            <span className="urdu text-xs" lang="ur">فون</span>
          </a>
        )}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-14 flex-col items-center justify-center rounded-2xl bg-brand/10 text-brand"
        >
          <Navigation className="size-6" />
          <span className="urdu text-xs" lang="ur">راستہ</span>
        </a>
        <Link href={`/worker/jobs/${job.id}`} className="flex h-14 flex-col items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <MessageCircle className="size-6" />
          <span className="urdu text-xs" lang="ur">بات</span>
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
        className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-ok text-white shadow active:scale-[0.98]"
      >
        <CheckCheck className="size-8" />
        <span className="urdu text-xl font-bold" lang="ur">کام مکمل</span>
      </button>
    </section>
  );
}

/** One incoming request (list item). */
function RequestCard({ job }: { job: JobDTO }) {
  const decline = useWorkerDashStore((s) => s.decline);
  const router = useRouter();
  const t = TRADES[job.trade];
  const area = AREA_BY_ID[job.areaId];
  const offer = job.pendingOffer;
  const say = `نیا کام۔ ${job.summaryUr || job.problemText}۔ ${job.distanceKm ?? ""} کلومیٹر دور۔${offer ? ` گاہک ${offer.amount} روپے دے رہا ہے۔` : ""}`;
  return (
    <li className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-bg text-3xl" aria-hidden>{t.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="urdu text-lg leading-9" lang="ur">{job.summaryUr || job.problemText}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted" dir="ltr">
            <span className="flex items-center gap-1"><MapPin className="size-4" /> {area?.en} · {job.distanceKm} km</span>
            <span>{job.customer.name}</span>
            <span className="urdu" lang="ur">{minutesAgo(job.createdAt)}</span>
            <AiBadge source={job.triageSource} />
          </div>
        </div>
        <SpeakButton ur={say} />
      </div>
      {job.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={job.photoUrl} alt="Problem photo" className="max-h-48 w-full rounded-2xl object-cover" />
      )}
      {offer && (
        <div className="flex items-center justify-between rounded-2xl bg-sun-soft px-4 py-2 ring-1 ring-amber-200">
          <span className="urdu text-base" lang="ur">{offer.by === "customer" ? "گاہک کی پیشکش" : "آپ کی قیمت"}</span>
          <span className="text-2xl font-black" dir="ltr">Rs {offer.amount.toLocaleString("en-PK")}</span>
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          onClick={() => router.push(`/worker/jobs/${job.id}`)}
          className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-ok text-white active:scale-[0.98]"
        >
          <Check className="size-8" strokeWidth={3} />
          <span className="urdu text-xl font-bold" lang="ur">دیکھیں / بات کریں</span>
        </button>
        <button
          onClick={() => void decline(job.id)}
          aria-label="Decline"
          className="flex size-16 items-center justify-center rounded-2xl bg-red-50 text-danger active:scale-95"
        >
          <X className="size-8" strokeWidth={3} />
        </button>
      </div>
    </li>
  );
}

function Requests() {
  const requests = useWorkerDashStore((s) => s.requests);
  const worker = useWorkerDashStore((s) => s.worker);
  if (!worker) return null;
  if (!requests.length)
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line p-6 text-center" dir="rtl">
        <span className="text-4xl" aria-hidden>{worker.isOnline ? "🔔" : "😴"}</span>
        <p className="urdu text-lg" lang="ur">
          {worker.availability === "busy" ? "کام ختم ہو تو نئے کام آئیں گے" : worker.isOnline ? "ابھی کوئی نیا کام نہیں۔ کام آئے گا تو گھنٹی بجے گی۔" : "کام لینے کے لیے اوپر والا بٹن دبائیں"}
        </p>
      </div>
    );
  return (
    <section className="flex flex-col gap-3" dir="rtl">
      <h2 className="urdu flex items-center gap-2 text-xl font-bold" lang="ur">
        نئے کام <span className="rounded-full bg-danger px-2 text-sm text-white" dir="ltr">{requests.length}</span>
      </h2>
      <ul className="flex flex-col gap-3">
        {requests.map((j) => (
          <RequestCard key={j.id} job={j} />
        ))}
      </ul>
    </section>
  );
}

function TrustPanel() {
  const worker = useWorkerDashStore((s) => s.worker);
  const signOut = useSessionStore((s) => s.signOut);
  const router = useRouter();
  if (!worker) return null;
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line" dir="rtl">
      <div className="flex items-center gap-3">
        <Avatar name={worker.name} photoUrl={worker.photoUrl} trade={worker.trade} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{worker.nameUr || worker.name}</p>
          <div className="flex items-center gap-2 text-sm" dir="ltr">
            <Stars value={worker.ratingAvg} />
            <span className="font-semibold">{worker.ratingAvg ? worker.ratingAvg.toFixed(1) : "New"}</span>
            <span className="text-muted">· {worker.jobsCompleted} jobs</span>
          </div>
        </div>
        <button
          aria-label="Sign out"
          onClick={async () => {
            await signOut();
            router.replace("/");
          }}
          className="flex size-10 items-center justify-center rounded-full bg-zinc-100"
        >
          <LogOut className="size-5" />
        </button>
      </div>
      {worker.trustSummaryUr && (
        <div className="flex items-start gap-2 rounded-2xl bg-bg p-3">
          <p className="urdu flex-1 text-base" lang="ur">{worker.trustSummaryUr}</p>
          <SpeakButton ur={worker.trustSummaryUr} size="sm" />
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-muted" dir="ltr">
        <span>What customers see about you</span>
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
