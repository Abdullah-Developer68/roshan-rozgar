"use client";
import { Star } from "lucide-react";
import { useState } from "react";
import { useJobStore } from "@/stores/job-store";
import { MicButton } from "@/components/ui/mic-button";
import { Spinner } from "@/components/ui/spinner";
import { REVIEW_TAGS } from "@/lib/validation";
import { useT } from "@/lib/i18n";

/** Post-job review: structured signals (stars, tags, price honesty) + an optional spoken/typed comment. */
export function ReviewForm() {
  const job = useJobStore((s) => s.job);
  const review = useJobStore((s) => s.review);
  const acting = useJobStore((s) => s.acting);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [paid, setPaid] = useState<boolean | null>(null);
  const [again, setAgain] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const { t, pick } = useT();
  if (!job) return null;

  const yesNo = (value: boolean | null, set: (v: boolean) => void) => (
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => set(v)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${value === v ? (v ? "bg-ok text-white" : "bg-danger text-white") : "bg-white ring-1 ring-line"}`}
        >
          {v ? t("yes") : t("no")}
        </button>
      ))}
    </div>
  );

  return (
    <form
      className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) return;
        void review({ rating, tags, paidAgreedPrice: paid, wouldHireAgain: again, comment: comment.trim() || null });
      }}
    >
      <h3 className="font-bold">{t("howWas", { name: job.worker.name })}</h3>
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" aria-label={`${i} stars`} onClick={() => setRating(i)}>
            <Star className={`size-10 ${rating >= i ? "fill-sun text-sun" : "text-zinc-300"}`} />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {REVIEW_TAGS.map((tag) => {
          const on = tags.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => setTags(on ? tags.filter((x) => x !== tag.id) : [...tags, tag.id])}
              className={`rounded-full px-3 py-1.5 text-sm ${on ? "bg-brand text-white" : "bg-bg ring-1 ring-line"}`}
            >
              {tag.emoji} {pick(tag.id, tag.ur)}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>{t("paidAgreed", { a: job.agreedPrice?.toLocaleString("en-PK") ?? "" })}</span>
        {yesNo(paid, setPaid)}
      </div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>{t("hireAgain")}</span>
        {yesNo(again, setAgain)}
      </div>
      <div className="flex items-center gap-2">
        <MicButton id="review" size="md" onDone={(r) => setComment((c) => `${c} ${r.text}`.trim())} />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          dir="auto"
          placeholder={t("reviewPh")}
          className="min-w-0 flex-1 rounded-2xl bg-bg p-3 outline-none ring-1 ring-line"
        />
      </div>
      <button disabled={!rating || acting} className="flex h-12 items-center justify-center rounded-2xl bg-brand font-bold text-white disabled:opacity-50">
        {acting ? <Spinner /> : t("submitReview")}
      </button>
      <p className="text-center text-xs text-muted">{t("reviewNote")}</p>
    </form>
  );
}
