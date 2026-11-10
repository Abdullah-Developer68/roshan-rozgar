"use client";
import { ArrowLeft, BadgeCheck, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBrowseStore } from "@/stores/browse-store";
import { useRequestStore } from "@/stores/request-store";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { StatusPill } from "@/components/ui/status-pill";
import { AudioNote } from "@/components/ui/audio-note";
import { AiBadge } from "@/components/ui/ai-badge";
import { TradePill } from "@/components/ui/trade-pill";
import { Spinner } from "@/components/ui/spinner";
import { AREA_BY_ID } from "@/lib/areas";
import { formatPkr } from "@/lib/geo";
import type { ReviewDTO } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { REVIEW_TAGS } from "@/lib/validation";
import { TRADES } from "@/lib/trades";

function ReviewItem({ r }: { r: ReviewDTO }) {
  const { t, pick, date } = useT();
  const tagLabel = (tag: string) => {
    const known = REVIEW_TAGS.find((x) => x.id === tag);
    return known ? pick(known.id, known.ur) : tag;
  };
  return (
    <li className="flex flex-col gap-1 rounded-2xl bg-white p-3 ring-1 ring-line">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2">
          <Stars value={r.rating} size="size-3.5" />
          <span className="font-semibold">{r.customerName}</span>
          <span className="flex items-center gap-0.5 text-[11px] text-ok"><BadgeCheck className="size-3" /> {t("verifiedJob")}</span>
        </span>
        <span className="text-xs text-muted">{date(r.createdAt, { month: "short", day: "numeric" })}</span>
      </div>
      {r.comment && <p className="text-sm" dir="auto">{r.comment}</p>}
      <div className="flex flex-wrap gap-1 text-[11px]">
        {r.tags.map((tag) => (
          <span key={tag} className={`rounded-full px-2 py-0.5 ${tag === "Late" || tag === "Overcharged" ? "bg-red-50 text-red-800" : "bg-bg"}`}>{tagLabel(tag)}</span>
        ))}
        {r.agreedPrice != null && <span className="rounded-full bg-bg px-2 py-0.5">{t("paidX", { p: formatPkr(r.agreedPrice) })}</span>}
        {r.paidAgreedPrice === false && <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-800">{t("askedMore")}</span>}
        {r.isSeeded && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500">{t("aiSeed")}</span>}
      </div>
    </li>
  );
}

function Profile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const profile = useBrowseStore((s) => s.profile);
  const loading = useBrowseStore((s) => s.profileLoading);
  const loadProfile = useBrowseStore((s) => s.loadProfile);
  const hasTriage = useRequestStore((s) => !!s.triage);
  const isSelected = useRequestStore((s) => s.selected.includes(id));
  const toggle = useRequestStore((s) => s.toggleSelected);
  const setTrade = useRequestStore((s) => s.setTrade);
  const { t, pick, date, isUr } = useT();

  useEffect(() => {
    void loadProfile(id);
  }, [id, loadProfile]);

  if (!profile || profile.worker.id !== id)
    return loading ? (
      <div className="flex justify-center py-10"><Spinner className="size-8 text-brand" /></div>
    ) : (
      <p className="py-10 text-center">{t("workerNotFound")}</p>
    );

  const { worker: w, reviews, priceStats } = profile;
  const area = AREA_BY_ID[w.areaId];
  const paidAsAgreed = reviews.filter((r) => r.paidAgreedPrice !== null);
  const honesty = paidAsAgreed.length ? Math.round((paidAsAgreed.filter((r) => r.paidAgreedPrice).length / paidAsAgreed.length) * 100) : null;
  const rehire = reviews.filter((r) => r.wouldHireAgain !== null);
  const rehirePct = rehire.length ? Math.round((rehire.filter((r) => r.wouldHireAgain).length / rehire.length) * 100) : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 self-start text-sm text-muted">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("back")}
      </button>
      <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
        <div className="flex items-start gap-4">
          <Avatar name={w.name} photoUrl={w.photoUrl} trade={w.trade} size="size-20" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">
              {pick(w.name, w.nameUr)} {w.nameUr && !isUr && <span className="urdu font-normal text-muted" lang="ur">· {w.nameUr}</span>}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <TradePill trade={w.trade} />
              <StatusPill value={w.availability} />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm">
              <Stars value={w.ratingAvg} /> <b>{w.ratingAvg.toFixed(1)}</b> <span className="text-muted">{t("verifiedReviews", { n: w.ratingCount })}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Stat label={t("statJobs")} value={String(w.jobsCompleted)} />
          <Stat label={t("statExp")} value={`${w.experienceYears} ${t("years")}`} />
          <Stat label={t("statHonest")} value={honesty == null ? "—" : `${honesty}%`} />
          <Stat label={t("statRehire")} value={rehirePct == null ? "—" : `${rehirePct}%`} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="flex items-center gap-1"><MapPin className="size-4" /> {isUr ? area?.ur : `${area?.en}, ${area?.city}`}</span>
          <span className="flex items-center gap-1"><CalendarDays className="size-4" /> {t("memberSince", { d: date(w.memberSince, { month: "short", year: "numeric" }) })}</span>
          <span>{t("visitCharge")} <b className="text-ink" dir="ltr">{formatPkr(w.visitCharge)}</b></span>
        </div>
        {pick(w.bioEn, w.bioUr) && <p className="text-sm">{pick(w.bioEn, w.bioUr)}</p>}
        {w.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {w.skills.map((s) => (
              <span key={s} className="rounded-full bg-bg px-3 py-1 text-xs font-medium">{s}</span>
            ))}
          </div>
        )}
        {w.voiceIntroUrl && (
          <div className="flex items-center gap-2 text-sm">
            <AudioNote src={w.voiceIntroUrl} label={t("voiceIntro")} /> <span className="text-muted">{t("recordedOnJoin")}</span>
          </div>
        )}
      </section>

      {pick(w.trustSummaryEn, w.trustSummaryUr) && (
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-bold">{t("reviewSummary")}</h2>
            <AiBadge source={w.trustSummarySource} />
          </div>
          <p className="text-sm">{pick(w.trustSummaryEn, w.trustSummaryUr)}</p>
        </section>
      )}

      {priceStats.count > 0 && (
        <p className="rounded-2xl bg-sun-soft p-3 text-sm text-amber-950">
          {t("typicalPrice", {
            trade: pick(TRADES[w.trade].en, TRADES[w.trade].ur),
            range: `${formatPkr(priceStats.p25)} – ${formatPkr(priceStats.p75)}`,
            m: formatPkr(priceStats.median),
            n: priceStats.count,
          })}
        </p>
      )}

      {w.availability === "available" && (
        <button
          onClick={() => {
            if (!hasTriage) setTrade(w.trade);
            if (!isSelected) toggle(w.id);
            router.push("/customer");
          }}
          className="h-12 rounded-2xl bg-brand font-bold text-white"
        >
          {isSelected ? t("selectedBack") : t("selectForRequest")}
        </button>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">{t("reviews")}</h2>
        {reviews.length === 0 && <p className="text-sm text-muted">{t("noReviews")}</p>}
        <ul className="flex flex-col gap-2">
          {reviews.map((r) => (
            <ReviewItem key={r.id} r={r} />
          ))}
        </ul>
      </section>
      <Link href="/customer" className="text-center text-sm text-muted underline">{t("newRequest")}</Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bg p-2 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

export function WorkerProfileScreen() {
  return (
    <CustomerShell>
      <Profile />
    </CustomerShell>
  );
}
