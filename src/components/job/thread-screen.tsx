"use client";
import { ArrowLeft, ArrowRight, CheckCheck, MapPin, Navigation, Phone, SendHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
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
import { AREA_BY_ID } from "@/lib/areas";
import { P } from "@/lib/phrases";
import type { JobStatus, MessageDTO } from "@/lib/types";

const STATUS_TEXT: Record<JobStatus, { en: string; ur: string; cls: string }> = {
  requested: { en: "Agreeing on price", ur: "قیمت طے ہو رہی ہے", cls: "bg-sun-soft text-amber-900" },
  booked: { en: "Booked", ur: "کام پکا", cls: "bg-orange-100 text-orange-900" },
  completed: { en: "Completed", ur: "مکمل", cls: "bg-emerald-100 text-emerald-900" },
  declined: { en: "Declined by worker", ur: "انکار", cls: "bg-zinc-100 text-zinc-700" },
  cancelled: { en: "Cancelled", ur: "منسوخ", cls: "bg-zinc-100 text-zinc-700" },
  expired: { en: "Worker got busy", ur: "کاریگر مصروف ہو گیا", cls: "bg-zinc-100 text-zinc-700" },
};

function useIsWorker() {
  return useJobStore((s) => s.job?.viewerRole === "worker");
}

function Header() {
  const job = useJobStore((s) => s.job);
  const isWorker = useIsWorker();
  if (!job) return null;
  const st = STATUS_TEXT[job.status];
  const other = isWorker
    ? { name: job.customer.name, photo: null, phone: job.customer.phone }
    : { name: job.worker.name, photo: job.worker.photoUrl, phone: job.worker.phone };
  const Back = isWorker ? ArrowRight : ArrowLeft;
  return (
    <header className="sticky top-0 z-20 -mx-4 flex items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur" dir={isWorker ? "rtl" : "ltr"}>
      <Link href={isWorker ? "/worker" : "/customer/jobs"} aria-label="Back" className="flex size-10 items-center justify-center rounded-full bg-white ring-1 ring-line">
        <Back className="size-5" />
      </Link>
      <Avatar name={other.name} photoUrl={other.photo} size="size-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{other.name}</p>
        <span className={`inline-block rounded-full px-2 text-xs font-semibold ${st.cls}`}>
          {isWorker ? <span className="urdu text-sm leading-6" lang="ur">{st.ur}</span> : st.en}
        </span>
      </div>
      {other.phone && (
        <a href={`tel:${other.phone}`} aria-label="Call" className="flex size-11 items-center justify-center rounded-full bg-ok text-white">
          <Phone className="size-5" />
        </a>
      )}
    </header>
  );
}

function JobCard() {
  const job = useJobStore((s) => s.job);
  const isWorker = useIsWorker();
  if (!job) return null;
  const area = AREA_BY_ID[job.areaId];
  return (
    <section className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line" dir={isWorker ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-2">
        <TradePill trade={job.trade} urdu={isWorker} />
        <AiBadge source={job.triageSource} />
      </div>
      {isWorker ? (
        <div className="flex items-start gap-2">
          <p className="urdu flex-1 text-lg" lang="ur">{job.summaryUr || job.problemText}</p>
          <SpeakButton ur={job.summaryUr || job.problemText} size="sm" />
        </div>
      ) : (
        <p className="font-medium">{job.summaryEn || job.problemText}</p>
      )}
      {job.summaryEn && !isWorker && job.problemText !== job.summaryEn && (
        <p className="text-sm text-muted" dir="auto">“{job.problemText}”</p>
      )}
      {job.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={job.photoUrl} alt="Problem" className="max-h-56 rounded-2xl object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted" dir="ltr">
        <span className="flex items-center gap-1"><MapPin className="size-4" /> {area?.en}{job.distanceKm != null ? ` · ${job.distanceKm} km from worker` : ""}</span>
        {job.agreedPrice != null && <span className="rounded-full bg-emerald-50 px-2 font-bold text-emerald-800">Agreed Rs {job.agreedPrice.toLocaleString("en-PK")}</span>}
      </div>
      {job.status === "booked" && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <Navigation className="size-4" /> {isWorker ? <span className="urdu" lang="ur">گاہک تک راستہ</span> : "Worker's route to you"}
        </a>
      )}
      {job.addressNote && <p className="text-sm" dir="auto">📍 {job.addressNote}</p>}
    </section>
  );
}

function Bubble({ m }: { m: MessageDTO }) {
  const isWorker = useIsWorker();
  const accept = useJobStore((s) => s.accept);
  const acting = useJobStore((s) => s.acting);
  const status = useJobStore((s) => s.job?.status);

  if (m.kind === "system")
    return (
      <li className="mx-auto max-w-[85%] rounded-2xl bg-zinc-100 px-3 py-1.5 text-center text-xs text-zinc-700">
        {isWorker && m.textUr ? <span className="urdu text-sm" lang="ur" dir="rtl">{m.textUr}</span> : m.textEn ?? m.text}
      </li>
    );

  const mine = m.mine;
  const align = mine ? "self-end" : "self-start";

  if (m.kind === "offer") {
    const pending = m.offerStatus === "pending" && status === "requested";
    const canAccept = pending && !mine;
    const whoUr = m.senderRole === "worker" ? "کاریگر کی قیمت" : "گاہک کی پیشکش";
    const whoEn = m.senderRole === "worker" ? "Worker's price" : "Customer's offer";
    return (
      <li className={`${align} w-[80%] max-w-xs rounded-3xl p-4 shadow-sm ring-2 ${m.offerStatus === "accepted" ? "bg-emerald-50 ring-ok" : pending ? "bg-sun-soft ring-sun" : "bg-white opacity-60 ring-line"}`}>
        <div className="flex items-center justify-between gap-2" dir={isWorker ? "rtl" : "ltr"}>
          <span className="text-xs font-semibold">
            {isWorker ? <span className="urdu text-sm" lang="ur">{whoUr}</span> : whoEn}
          </span>
          <AiBadge source={m.aiSource} />
        </div>
        <p className="text-3xl font-black" dir="ltr">Rs {m.offerAmount?.toLocaleString("en-PK")}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {m.offerStatus === "accepted" ? "✅ Accepted" : m.offerStatus === "superseded" ? "Replaced" : mine ? "Waiting for reply" : "New price"}
        </p>
        {canAccept && (
          <button
            onClick={() => void accept(m.id)}
            disabled={acting}
            className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ok text-white shadow active:scale-[0.98] disabled:opacity-60"
          >
            {acting ? <Spinner /> : <CheckCheck className="size-7" />}
            {isWorker ? <span className="urdu text-lg font-bold" lang="ur">منظور — کام پکا</span> : <span className="font-bold">Accept & book</span>}
          </button>
        )}
      </li>
    );
  }

  const primary = isWorker ? m.textUr || m.text : m.textEn || m.text;
  const secondary = primary !== m.text ? m.text : null;
  return (
    <li className={`${align} flex max-w-[85%] flex-col gap-1.5 rounded-3xl px-4 py-3 shadow-sm ${mine ? "bg-brand text-white" : "bg-white ring-1 ring-line"}`}>
      {m.audioUrl && <AudioNote src={m.audioUrl} tone={mine ? "dark" : "light"} />}
      {primary && (
        <div className="flex items-start gap-2">
          <p className={`flex-1 ${isWorker ? "urdu text-lg" : ""}`} dir="auto">{primary}</p>
          {isWorker && !mine && m.textUr && <SpeakButton ur={m.textUr} size="sm" />}
        </div>
      )}
      {secondary && <p className={`text-xs ${mine ? "text-white/70" : "text-muted"}`} dir="auto">Original: {secondary}</p>}
      {m.aiSource && !mine && (m.textEn || m.textUr) && (
        <span className="self-start">
          <AiBadge source={m.aiSource} />
        </span>
      )}
    </li>
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
      {messages.map((m) => (
        <Bubble key={m.id} m={m} />
      ))}
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
  return <p className="urdu rounded-2xl bg-white/90 px-3 py-1 text-center text-base ring-1 ring-line" dir="auto">{text || "…"}</p>;
}

function PriceBar() {
  const job = useJobStore((s) => s.job);
  const counter = useJobStore((s) => s.counterAmount);
  const setCounter = useJobStore((s) => s.setCounter);
  const sendOffer = useJobStore((s) => s.sendOffer);
  const acting = useJobStore((s) => s.acting);
  const isWorker = useIsWorker();
  if (!job || job.status !== "requested") return null;
  const offer = job.pendingOffer;
  const mineIsLatest = offer && offer.by === job.viewerRole;
  const value = counter ?? job.worker.visitCharge;
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-line">
      <PriceStepper value={value} onChange={setCounter} />
      <button
        onClick={() => void sendOffer(value)}
        disabled={acting || (!!mineIsLatest && offer?.amount === value)}
        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-sun font-bold text-amber-950 active:scale-[0.98] disabled:opacity-50"
      >
        {isWorker ? <span className="urdu text-lg" lang="ur">یہ قیمت بھیجیں</span> : "Propose this price"}
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
  if (!job || (job.status !== "requested" && job.status !== "booked")) return null;
  return (
    <div className="flex flex-col gap-2">
      <LiveCaption />
      <div className="flex items-center gap-2">
        <MicButton id="thread" size="md" record onDone={(r) => void sendVoice(r)} disabled={sending} />
        <form
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white py-1 pl-4 pr-1 ring-1 ring-line"
          onSubmit={(e) => {
            e.preventDefault();
            void sendText();
          }}
        >
          <input
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder={isWorker ? "یا لکھیں…" : "Type in English or Urdu…"}
            dir="auto"
            className="min-w-0 flex-1 bg-transparent py-2 outline-none"
          />
          <button disabled={sending || !draftText.trim()} aria-label="Send" className="flex size-10 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40">
            {sending ? <Spinner className="size-4" /> : <SendHorizontal className="size-4" />}
          </button>
        </form>
      </div>
      <p className="text-center text-[11px] text-muted">
        {isWorker ? "Voice notes are transcribed and translated for the customer" : "Workers hear your message in Urdu · voice notes are translated to English"}
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
  if (!job) return null;

  if (job.status === "booked")
    return (
      <div className="flex gap-2">
        <button
          onClick={() => void complete()}
          disabled={acting}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-ok font-bold text-white active:scale-[0.98]"
        >
          <CheckCheck className="size-6" /> {isWorker ? <span className="urdu text-lg" lang="ur">کام مکمل</span> : "Job is done"}
        </button>
        <button onClick={() => void close("cancel")} disabled={acting} className="h-14 rounded-2xl bg-white px-4 text-sm text-danger ring-1 ring-line">
          {isWorker ? <span className="urdu" lang="ur">منسوخ</span> : "Cancel"}
        </button>
      </div>
    );

  if (job.status === "requested")
    return (
      <button
        onClick={() => void close(isWorker ? "decline" : "cancel")}
        disabled={acting}
        className="flex h-11 items-center justify-center gap-1 rounded-2xl text-sm text-danger"
      >
        <X className="size-4" /> {isWorker ? <span className="urdu" lang="ur">یہ کام نہیں کر سکتا</span> : "Cancel request"}
      </button>
    );

  if (job.status === "completed") {
    if (isWorker)
      return <p className="urdu rounded-2xl bg-emerald-50 p-3 text-center text-lg text-emerald-900" lang="ur">شکریہ! کام مکمل ہو گیا۔ آپ نئے کام کے لیے فارغ ہیں۔</p>;
    if (job.hasReview) return <p className="rounded-2xl bg-emerald-50 p-3 text-center text-emerald-900">Thanks — your review is on {job.worker.name}&apos;s profile.</p>;
    return reviewOpen ? (
      <ReviewForm />
    ) : (
      <button onClick={() => setReviewOpen(true)} className="h-12 rounded-2xl bg-sun font-bold text-amber-950">
        Rate {job.worker.name}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-zinc-100 p-3 text-center text-sm">
      <p>{STATUS_TEXT[job.status].en}. {job.closeReason === "worker_busy" ? "This worker took another job." : ""}</p>
      {!isWorker && (
        <Link href="/customer" className="rounded-xl bg-brand px-4 py-2 font-semibold text-white">
          Find another worker
        </Link>
      )}
    </div>
  );
}

function WorkerThreadHint() {
  const isWorker = useIsWorker();
  const status = useJobStore((s) => s.job?.status);
  useAutoSpeak(P.thread.ur, P.thread.hi, isWorker && status === "requested");
  if (!isWorker || status !== "requested") return null;
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-sun-soft p-2 ring-1 ring-amber-200" dir="rtl">
      <SpeakButton ur={P.thread.ur} hi={P.thread.hi} size="sm" />
      <p className="urdu text-sm" lang="ur">مائیک دبا کر بات کریں، یا قیمت بدل کر بھیجیں</p>
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
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p>This job doesn&apos;t exist or you&apos;re not part of it.</p>
        <Link href="/" className="rounded-xl bg-brand px-4 py-2 text-white">Home</Link>
      </div>
    );

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pb-4">
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
