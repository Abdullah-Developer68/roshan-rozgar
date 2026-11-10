"use client";
import { ArrowLeft, ArrowRight, CheckCheck, MapPin, Navigation, Phone, SendHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { spring } from "@/components/ui/motion";
import { useJobStore } from "@/stores/job-store";
import { useSessionStore } from "@/stores/session-store";
import { useVoiceStore } from "@/stores/voice-store";
import { MicButton } from "@/components/ui/mic-button";
import { SpeakButton, useAutoSpeak } from "@/components/ui/speak-button";
import { AudioNote } from "@/components/ui/audio-note";
import { PriceStepper } from "@/components/ui/price-stepper";
import { AiBadge } from "@/components/ui/ai-badge";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { TradePill } from "@/components/ui/trade-pill";
import { ReviewForm } from "@/components/job/review-form";
import { SttStatus } from "@/components/ui/stt-status";
import { AREA_BY_ID } from "@/lib/areas";
import { LangToggle } from "@/components/ui/lang-toggle";
import { P } from "@/lib/phrases";
import { useT, type MsgKey } from "@/lib/i18n";
import type { JobStatus, MessageDTO } from "@/lib/types";

const STATUS_CLS: Record<JobStatus, string> = {
  requested: "bg-sun-soft text-foreground",
  booked: "bg-orange-100 text-orange-900",
  completed: "bg-emerald-100 text-emerald-900",
  declined: "bg-zinc-100 text-zinc-700",
  cancelled: "bg-zinc-100 text-zinc-700",
  expired: "bg-zinc-100 text-zinc-700",
};
const statusKey = (s: JobStatus) => `jobStatus_${s}` as MsgKey;

function useIsWorker() {
  return useJobStore((s) => s.job?.viewerRole === "worker");
}

function Header() {
  const job = useJobStore((s) => s.job);
  const isWorker = useIsWorker();
  const { t, isUr, pick } = useT();
  if (!job) return null;
  const other = isWorker
    ? { name: job.customer.name, photo: null, phone: job.customer.phone }
    : { name: pick(job.worker.name, job.worker.nameUr), photo: job.worker.photoUrl, phone: job.worker.phone };
  const Back = isUr ? ArrowRight : ArrowLeft;
  return (
    <header className="sticky top-0 z-20 -mx-4 flex items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
      <Link href={isWorker ? "/worker" : "/customer/jobs"} aria-label={t("back")} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card border border-border">
        <Back className="size-5" />
      </Link>
      <Avatar name={isWorker ? job.customer.name : job.worker.name} photoUrl={other.photo} size="size-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{other.name}</p>
        <span className={`inline-block rounded-full px-2 text-xs font-semibold ${STATUS_CLS[job.status]}`}>{t(statusKey(job.status))}</span>
      </div>
      <LangToggle />
      {other.phone && (
        <a href={`tel:${other.phone}`} aria-label={t("call")} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ok text-white">
          <Phone className="size-5" />
        </a>
      )}
    </header>
  );
}

function JobCard() {
  const job = useJobStore((s) => s.job);
  const isWorker = useIsWorker();
  const { t, pick } = useT();
  if (!job) return null;
  const area = AREA_BY_ID[job.areaId];
  const summary = pick(job.summaryEn, job.summaryUr) || job.problemText;
  return (
    <section className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between gap-2">
        <TradePill trade={job.trade} />
        <AiBadge source={job.triageSource} />
      </div>
      <div className="flex items-start gap-2">
        <p className="flex-1 text-lg font-medium">{summary}</p>
        <SpeakButton ur={job.summaryUr} en={job.summaryEn || job.problemText} size="sm" />
      </div>
      {summary !== job.problemText && (
        <p className="text-sm text-muted-foreground" dir="auto">“{job.problemText}”</p>
      )}
      {job.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={job.photoUrl} alt="Problem" className="max-h-56 rounded-lg object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="size-4" /> <span dir="ltr">{area?.en}</span>
          {job.distanceKm != null ? ` · ${t("kmFromWorker", { km: job.distanceKm })}` : ""}
        </span>
        {job.agreedPrice != null && (
          <span className="rounded-full bg-emerald-50 px-2 font-semibold text-emerald-800">{t("agreedX", { a: job.agreedPrice.toLocaleString("en-PK") })}</span>
        )}
      </div>
      {job.status === "booked" && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <Navigation className="size-4" /> {isWorker ? t("routeToCustomer") : t("routeToYou")}
        </a>
      )}
      {job.addressNote && <p className="flex items-center gap-1.5 text-sm" dir="auto"><MapPin className="size-4 shrink-0" /> {job.addressNote}</p>}
    </section>
  );
}

function Bubble({ m }: { m: MessageDTO }) {
  const { t, pick, isUr } = useT();
  const accept = useJobStore((s) => s.accept);
  const acting = useJobStore((s) => s.acting);
  const status = useJobStore((s) => s.job?.status);

  if (m.kind === "system")
    return (
      <motion.li layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-[85%] rounded-lg bg-muted px-3 py-1.5 text-center text-xs text-muted-foreground">
        {pick(m.textEn, m.textUr) || m.text}
      </motion.li>
    );

  const mine = m.mine;
  const align = mine ? "self-end" : "self-start";

  if (m.kind === "offer") {
    const pending = m.offerStatus === "pending" && status === "requested";
    const canAccept = pending && !mine;
    const who = m.senderRole === "worker" ? t("workersPrice") : t("customersOffer");
    return (
      <motion.li
        layout
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring}
        className={`${align} w-[80%] max-w-xs rounded-xl p-4 shadow-sm ring-2 ${m.offerStatus === "accepted" ? "bg-emerald-50 ring-ok" : pending ? "bg-sun-soft ring-sun" : "bg-card opacity-60 ring-line"}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold">{who}</span>
          <AiBadge source={m.aiSource} />
        </div>
        <p className="text-3xl font-black" dir="ltr">Rs {m.offerAmount?.toLocaleString("en-PK")}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          {m.offerStatus === "accepted" ? t("offerAccepted") : m.offerStatus === "superseded" ? t("offerReplaced") : mine ? t("offerWaiting") : t("offerNew")}
        </p>
        {canAccept && (
          <button
            onClick={() => void accept(m.id)}
            disabled={acting}
            className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-ok text-white shadow active:scale-[0.98] disabled:opacity-60"
          >
            {acting ? <Spinner /> : <CheckCheck className="size-7" />}
            <span className="text-lg font-semibold">{t("acceptBook")}</span>
          </button>
        )}
      </motion.li>
    );
  }

  const primary = pick(m.textEn, m.textUr) || m.text;
  const secondary = primary !== m.text ? m.text : null;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, x: mine ? 12 : -12 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={spring}
      className={`${align} flex max-w-[85%] flex-col gap-1.5 rounded-xl px-4 py-3 shadow-sm ${mine ? "bg-brand text-white" : "bg-card border border-border"}`}>
      {m.audioUrl && <AudioNote src={m.audioUrl} tone={mine ? "dark" : "light"} />}
      {primary && (
        <div className="flex items-start gap-2">
          <p className={`flex-1 ${isUr ? "text-lg" : ""}`} dir="auto">{primary}</p>
          {!mine && (m.textUr || m.textEn) && <SpeakButton ur={m.textUr} en={m.textEn} size="sm" />}
        </div>
      )}
      {secondary && <p className={`text-xs ${mine ? "text-white/70" : "text-muted-foreground"}`}>
          {t("original")} <span dir="auto">{secondary}</span>
        </p>}
      {m.aiSource && !mine && (m.textEn || m.textUr) && (
        <span className="self-start">
          <AiBadge source={m.aiSource} />
        </span>
      )}
    </motion.li>
  );
}

function Messages() {
  const messages = useJobStore((s) => s.messages);
  const endRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);
  return (
    <ul className="flex flex-col gap-3 py-2">
      <AnimatePresence initial={false}>
        {messages.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
      </AnimatePresence>
      <li ref={endRef} aria-hidden />
    </ul>
  );
}

function LiveCaption() {
  const ownerId = useVoiceStore((s) => s.ownerId);
  const finalText = useVoiceStore((s) => s.finalText);
  const interim = useVoiceStore((s) => s.interim);
  if (ownerId !== "thread") return null;
  const text = `${finalText} ${interim}`.trim();
  return <p className="urdu rounded-lg bg-white/90 px-3 py-1 text-center text-base border border-border" dir="auto">{text || "…"}</p>;
}

function PriceBar() {
  const job = useJobStore((s) => s.job);
  const counter = useJobStore((s) => s.counterAmount);
  const setCounter = useJobStore((s) => s.setCounter);
  const sendOffer = useJobStore((s) => s.sendOffer);
  const acting = useJobStore((s) => s.acting);
  const { t } = useT();
  if (!job || job.status !== "requested") return null;
  const offer = job.pendingOffer;
  const mineIsLatest = offer && offer.by === job.viewerRole;
  const value = counter ?? job.worker.visitCharge;
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-3 shadow-sm border border-border">
      <PriceStepper value={value} onChange={setCounter} />
      <button
        onClick={() => void sendOffer(value)}
        disabled={acting || (!!mineIsLatest && offer?.amount === value)}
        className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
      >
        <span className="text-lg">{t("sendPrice")}</span>
      </button>
    </div>
  );
}

function Composer() {
  const job = useJobStore((s) => s.job);
  const draftText = useJobStore((s) => s.draftText);
  const setDraftText = useJobStore((s) => s.setDraftText);
  const sendText = useJobStore((s) => s.sendText);
  const sendVoice = useJobStore((s) => s.sendVoice);
  const sending = useJobStore((s) => s.sending);
  const isWorker = useIsWorker();
  const { t } = useT();
  if (!job || (job.status !== "requested" && job.status !== "booked")) return null;
  return (
    <div className="flex flex-col gap-2">
      <LiveCaption />
      <SttStatus ownerId="thread" />
      <div className="flex items-center gap-2">
        <MicButton id="thread" size="md" record onDone={(r) => void sendVoice(r)} disabled={sending} />
        <form
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-card py-1 pl-4 pr-1 border border-border"
          onSubmit={(e) => {
            e.preventDefault();
            void sendText();
          }}
        >
          <input
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder={t("typeMessage")}
            dir="auto"
            className="min-w-0 flex-1 bg-transparent py-2 outline-none"
          />
          <button disabled={sending || !draftText.trim()} aria-label={t("send")} className="flex size-10 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40">
            {sending ? <Spinner className="size-4" /> : <SendHorizontal className="size-4" />}
          </button>
        </form>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        {isWorker ? t("noteWorker") : t("noteCustomer")}
      </p>
    </div>
  );
}

function Actions() {
  const job = useJobStore((s) => s.job);
  const close = useJobStore((s) => s.close);
  const complete = useJobStore((s) => s.complete);
  const acting = useJobStore((s) => s.acting);
  const reviewOpen = useJobStore((s) => s.reviewOpen);
  const setReviewOpen = useJobStore((s) => s.setReviewOpen);
  const isWorker = useIsWorker();
  const { t } = useT();
  if (!job) return null;

  if (job.status === "booked")
    return (
      <div className="flex gap-2">
        <button
          onClick={() => void complete()}
          disabled={acting}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-lg bg-ok font-semibold text-white active:scale-[0.98]"
        >
          <CheckCheck className="size-6" /> <span className="text-lg">{t("jobDone")}</span>
        </button>
        <button onClick={() => void close("cancel")} disabled={acting} className="h-14 rounded-lg bg-card px-4 text-sm text-danger border border-border">
          {t("cancel")}
        </button>
      </div>
    );

  if (job.status === "requested")
    return (
      <button
        onClick={() => void close(isWorker ? "decline" : "cancel")}
        disabled={acting}
        className="flex h-11 items-center justify-center gap-1 rounded-lg text-sm text-danger"
      >
        <X className="size-4" /> {isWorker ? t("cantDo") : t("cancelRequest")}
      </button>
    );

  if (job.status === "completed") {
    if (isWorker)
      return <p className="rounded-lg bg-emerald-50 p-3 text-center text-lg text-emerald-900">{t("thanksWorker")}</p>;
    if (job.hasReview)
      return <p className="rounded-lg bg-emerald-50 p-3 text-center text-emerald-900">{t("thanksReviewed", { name: job.worker.name })}</p>;
    return reviewOpen ? (
      <ReviewForm />
    ) : (
      <button onClick={() => setReviewOpen(true)} className="h-12 rounded-lg bg-primary font-semibold text-primary-foreground">
        {t("rateX", { name: job.worker.name })}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-zinc-100 p-3 text-center text-sm">
      <p>
        {t(statusKey(job.status))}. {job.closeReason === "worker_busy" ? t("tookOtherJob") : ""}
      </p>
      {!isWorker && (
        <Link href="/customer" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">
          {t("findAnother")}
        </Link>
      )}
    </div>
  );
}

function WorkerThreadHint() {
  const isWorker = useIsWorker();
  const status = useJobStore((s) => s.job?.status);
  const { t } = useT();
  useAutoSpeak(P.thread, isWorker && status === "requested");
  if (!isWorker || status !== "requested") return null;
  return (
    <div className="flex items-center gap-2 rounded-lg bg-sun-soft p-2 ring-1 ring-border">
      <SpeakButton ur={P.thread.ur} hi={P.thread.hi} en={P.thread.en} size="sm" />
      <p className="text-sm">{t("threadHint")}</p>
    </div>
  );
}

export function JobThreadScreen() {
  const { id } = useParams<{ id: string }>();
  const open = useJobStore((s) => s.open);
  const job = useJobStore((s) => s.job);
  const loading = useJobStore((s) => s.loading);
  const notFound = useJobStore((s) => s.notFound);
  const loadSession = useSessionStore((s) => s.load);
  const { t, dir, langClass, lang } = useT();

  useEffect(() => {
    void loadSession();
  }, [loadSession]);
  useEffect(() => open(id), [id, open]);

  if (loading && !job)
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-10 text-brand" />
      </div>
    );
  if (notFound || !job)
    return (
      <div className={`flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center ${langClass}`} dir={dir}>
        <p>{t("jobNotFound")}</p>
        <Link href="/" className="rounded-lg bg-brand px-4 py-2 text-white">{t("home")}</Link>
      </div>
    );

  return (
    <div className={`mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pb-4 ${langClass}`} dir={dir} lang={lang}>
      <Header />
      <JobCard />
      <WorkerThreadHint />
      <Messages />
      <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-2 border-t border-line bg-bg/95 px-4 pb-4 pt-3 backdrop-blur">
        <PriceBar />
        <Composer />
        <Actions />
      </div>
    </div>
  );
}
