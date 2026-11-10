"use client";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { useRequestStore } from "@/stores/request-store";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { StatusPill } from "@/components/ui/status-pill";
import { AudioNote } from "@/components/ui/audio-note";
import { AiBadge } from "@/components/ui/ai-badge";
import { AREA_BY_ID } from "@/lib/areas";
import type { WorkerSearchResult } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { REVIEW_TAGS } from "@/lib/validation";

/** One search result (list item). */
export function WorkerCard({ worker: w }: { worker: WorkerSearchResult }) {
  const selected = useRequestStore((s) => s.selected.includes(w.id));
  const toggle = useRequestStore((s) => s.toggleSelected);
  const focused = useRequestStore((s) => s.focusedWorkerId === w.id);
  const setFocused = useRequestStore((s) => s.setFocused);
  const best = useRequestStore((s) => s.results?.find((r) => r.availability === "available")?.id === w.id);
  const available = w.availability === "available";
  const { t, pick } = useT();
  const tagLabel = (tag: string) => {
    const known = REVIEW_TAGS.find((x) => x.id === tag);
    return known ? pick(known.id, known.ur) : tag;
  };

  if (!available)
    return (
      <li className="flex items-center gap-3 rounded-2xl bg-white/60 p-3 opacity-70 ring-1 ring-line">
        <Avatar name={w.name} photoUrl={w.photoUrl} size="size-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{pick(w.name, w.nameUr)}</p>
          <p className="text-xs text-muted" dir="ltr">{w.distanceKm} km · ★ {w.ratingAvg.toFixed(1)}</p>
        </div>
        <StatusPill value={w.availability} />
      </li>
    );

  return (
    <li
      onMouseEnter={() => setFocused(w.id)}
      className={`flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 transition ${selected ? "ring-2 ring-brand" : focused ? "ring-brand/40" : "ring-line"}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={w.name} photoUrl={w.photoUrl} trade={w.trade} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold">{pick(w.name, w.nameUr)}</p>
            {best && <span className="rounded-full bg-sun px-2 py-0.5 text-[11px] font-bold text-amber-950">{t("bestMatch")}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Stars value={w.ratingAvg} />
            <span className="font-semibold">{w.ratingCount ? w.ratingAvg.toFixed(1) : t("new")}</span>
            <span className="text-muted">({w.ratingCount})</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" /><span dir="ltr">{w.distanceKm} km · {AREA_BY_ID[w.areaId]?.en}</span></span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" />{t("minAway", { n: w.etaMin })}</span>
            <span className="flex items-center gap-1"><BadgeCheck className="size-3.5 text-ok" />{t("jobsDoneHere", { n: w.jobsCompleted })}</span>
            <span>{t("yrsExp", { n: w.experienceYears })}</span>
          </div>
        </div>
        <div className="text-end">
          <p className="text-xs text-muted">{t("visit")}</p>
          <p className="font-bold" dir="ltr">Rs {w.visitCharge.toLocaleString("en-PK")}</p>
        </div>
      </div>
      {pick(w.trustSummaryEn, w.trustSummaryUr) && (
        <div className="rounded-2xl bg-bg p-3 text-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">{t("whatCustomersSay")}</span>
            <AiBadge source={w.trustSummarySource} />
          </div>
          <p>{pick(w.trustSummaryEn, w.trustSummaryUr)}</p>
          {w.trustTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {w.trustTags.map((tag) => (
                <span key={tag} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tag === "Late" || tag === "Overcharged" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
                  {tagLabel(tag)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {w.voiceIntroUrl && <AudioNote src={w.voiceIntroUrl} label={t("hearThem")} />}
        <Link href={`/customer/workers/${w.id}`} className="text-sm font-semibold text-brand underline">
          {t("profileReviews")}
        </Link>
        <button
          onClick={() => toggle(w.id)}
          aria-pressed={selected}
          className={`ms-auto h-10 rounded-xl px-4 text-sm font-bold ${selected ? "bg-brand text-white" : "bg-brand/10 text-brand"}`}
        >
          {selected ? t("selected") : t("select")}
        </button>
      </div>
    </li>
  );
}
