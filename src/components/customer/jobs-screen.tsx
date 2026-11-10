"use client";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useBrowseStore } from "@/stores/browse-store";
import { useSessionStore } from "@/stores/session-store";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { TRADES } from "@/lib/trades";
import type { JobDTO } from "@/lib/types";
import { useT, type MsgKey } from "@/lib/i18n";

const LABEL_CLS: Record<JobDTO["status"], string> = {
  requested: "bg-sun-soft text-amber-900",
  booked: "bg-orange-100 text-orange-900",
  completed: "bg-emerald-100 text-emerald-900",
  declined: "bg-zinc-100 text-zinc-600",
  cancelled: "bg-zinc-100 text-zinc-600",
  expired: "bg-zinc-100 text-zinc-600",
};

function JobRow({ job }: { job: JobDTO }) {
  const { t, pick } = useT();
  const needsAction =
    (job.status === "requested" && job.pendingOffer?.by === "worker") || (job.status === "completed" && !job.hasReview);
  return (
    <li>
      <Link href={`/customer/jobs/${job.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-line">
        <Avatar name={job.worker.name} photoUrl={job.worker.photoUrl} trade={job.trade} size="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {pick(job.worker.name, job.worker.nameUr)} <span className="font-normal text-muted">· {pick(TRADES[job.trade].en, TRADES[job.trade].ur)}</span>
          </p>
          <p className="truncate text-sm text-muted">{pick(job.summaryEn, job.summaryUr) || job.problemText}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${LABEL_CLS[job.status]}`}>{t(`jobStatus_${job.status}` as MsgKey)}</span>
            {job.pendingOffer && (
              <span>
                {t(job.pendingOffer.by === "customer" ? "offerByYou" : "offerByWorker", { a: job.pendingOffer.amount.toLocaleString("en-PK") })}
              </span>
            )}
            {job.agreedPrice != null && <span>{t("agreedX", { a: job.agreedPrice.toLocaleString("en-PK") })}</span>}
            {needsAction && <span className="rounded-full bg-danger px-2 py-0.5 font-semibold text-white">{t("yourTurn")}</span>}
          </div>
        </div>
        <ChevronRight className="size-5 text-muted rtl:rotate-180" />
      </Link>
    </li>
  );
}

function JobsList() {
  const jobs = useBrowseStore((s) => s.myJobs);
  const poll = useBrowseStore((s) => s.pollMyJobs);
  const user = useSessionStore((s) => s.me?.user);
  const { t } = useT();
  useEffect(() => (user ? poll() : undefined), [user, poll]);
  if (!jobs)
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-8 text-brand" />
      </div>
    );
  const open = jobs.filter((j) => j.status === "requested" || j.status === "booked");
  const past = jobs.filter((j) => !(j.status === "requested" || j.status === "booked"));
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("myJobs")}</h1>
        <Link href="/customer" className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-white">
          <Plus className="size-4" /> {t("newRequest")}
        </Link>
      </div>
      {jobs.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm ring-1 ring-line">{t("noJobs")}</p>}
      {open.length > 0 && (
        <ul className="flex flex-col gap-2">
          {open.map((j) => (
            <JobRow key={j.id} job={j} />
          ))}
        </ul>
      )}
      {past.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted">{t("past")}</h2>
          <ul className="flex flex-col gap-2">
            {past.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function CustomerJobsScreen() {
  return (
    <CustomerShell>
      <JobsList />
    </CustomerShell>
  );
}
