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

function ReviewItem({ r }: { r: ReviewDTO }) {
  return (
    <li className="flex flex-col gap-1 rounded-2xl bg-white p-3 ring-1 ring-line">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2">
          <Stars value={r.rating} size="size-3.5" />
          <span className="font-semibold">{r.customerName}</span>
          <span className="flex items-center gap-0.5 text-[11px] text-ok"><BadgeCheck className="size-3" /> Verified job</span>
        </span>
        <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}</span>
      </div>
      {r.comment && <p className="text-sm" dir="auto">{r.comment}</p>}
      <div className="flex flex-wrap gap-1 text-[11px]">
        {r.tags.map((t) => (
          <span key={t} className={`rounded-full px-2 py-0.5 ${t === "Late" || t === "Overcharged" ? "bg-red-50 text-red-800" : "bg-bg"}`}>{t}</span>
        ))}
        {r.agreedPrice != null && <span className="rounded-full bg-bg px-2 py-0.5">Paid {formatPkr(r.agreedPrice)}</span>}
        {r.paidAgreedPrice === false && <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-800">Asked for more than agreed</span>}
        {r.isSeeded && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500">seeded</span>}
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

  useEffect(() => {
    void loadProfile(id);
  }, [id, loadProfile]);

  if (!profile || profile.worker.id !== id)
    return loading ? (
      <div className="flex justify-center py-10"><Spinner className="size-8 text-brand" /></div>
    ) : (
      <p className="py-10 text-center">Worker not found.</p>
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
        <ArrowLeft className="size-4" /> Back
      </button>
      <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
        <div className="flex items-start gap-4">
          <Avatar name={w.name} photoUrl={w.photoUrl} trade={w.trade} size="size-20" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{w.name} {w.nameUr && <span className="urdu font-normal text-muted" lang="ur">· {w.nameUr}</span>}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <TradePill trade={w.trade} />
              <StatusPill value={w.availability} />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm">
              <Stars value={w.ratingAvg} /> <b>{w.ratingAvg.toFixed(1)}</b> <span className="text-muted">({w.ratingCount} verified reviews)</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Stat label="Jobs done here" value={String(w.jobsCompleted)} />
          <Stat label="Experience" value={`${w.experienceYears} yrs`} />
          <Stat label="Charged as agreed" value={honesty == null ? "—" : `${honesty}%`} />
          <Stat label="Would hire again" value={rehirePct == null ? "—" : `${rehirePct}%`} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="flex items-center gap-1"><MapPin className="size-4" /> {area?.en}, {area?.city}</span>
          <span className="flex items-center gap-1"><CalendarDays className="size-4" /> Member since {new Date(w.memberSince).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}</span>
          <span>Visit charge <b className="text-ink">{formatPkr(w.visitCharge)}</b></span>
        </div>
        {w.bioEn && <p className="text-sm">{w.bioEn}</p>}
        {w.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {w.skills.map((s) => (
              <span key={s} className="rounded-full bg-bg px-3 py-1 text-xs font-medium">{s}</span>
            ))}
          </div>
        )}
        {w.voiceIntroUrl && (
          <div className="flex items-center gap-2 text-sm">
            <AudioNote src={w.voiceIntroUrl} label="Voice intro" /> <span className="text-muted">recorded when they joined</span>
          </div>
        )}
      </section>

      {w.trustSummaryEn && (
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-bold">Summary of verified reviews</h2>
            <AiBadge source={w.trustSummarySource} />
          </div>
          <p className="text-sm">{w.trustSummaryEn}</p>
        </section>
      )}

      {priceStats.count > 0 && (
        <p className="rounded-2xl bg-sun-soft p-3 text-sm text-amber-950">
          Typical price for a {w.trade.replace("_", " ")} job on Roshan Rozgar: <b>{formatPkr(priceStats.p25)} – {formatPkr(priceStats.p75)}</b> (median {formatPkr(priceStats.median)}, {priceStats.count} jobs).
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
          {isSelected ? "Selected — back to request" : "Select for my request"}
        </button>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">Reviews</h2>
        {reviews.length === 0 && <p className="text-sm text-muted">No reviews yet.</p>}
        <ul className="flex flex-col gap-2">
          {reviews.map((r) => (
            <ReviewItem key={r.id} r={r} />
          ))}
        </ul>
      </section>
      <Link href="/customer" className="text-center text-sm text-muted underline">New request</Link>
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
