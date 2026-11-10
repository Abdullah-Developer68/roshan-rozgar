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

const LABEL: Record<JobDTO["status"], { text: string; cls: string }> = {
  requested: { text: "Waiting / negotiating", cls: "bg-sun-soft text-amber-900" },
  booked: { text: "Booked", cls: "bg-orange-100 text-orange-900" },
  completed: { text: "Completed", cls: "bg-emerald-100 text-emerald-900" },
  declined: { text: "Declined", cls: "bg-zinc-100 text-zinc-600" },
  cancelled: { text: "Cancelled", cls: "bg-zinc-100 text-zinc-600" },
  expired: { text: "Worker got busy", cls: "bg-zinc-100 text-zinc-600" },
};

function JobRow({ job }: { job: JobDTO }) {
  const l = LABEL[job.status];
  const needsAction =
    (job.status === "requested" && job.pendingOffer?.by === "worker") || (job.status === "completed" && !job.hasReview);
  return (
    <li>
      <Link href={`/customer/jobs/${job.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-line">
        <Avatar name={job.worker.name} photoUrl={job.worker.photoUrl} trade={job.trade} size="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{job.worker.name} <span className="font-normal text-muted">· {TRADES[job.trade].en}</span></p>
          <p className="truncate text-sm text-muted">{job.summaryEn || job.problemText}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${l.cls}`}>{l.text}</span>
            {job.pendingOffer && <span>Offer Rs {job.pendingOffer.amount.toLocaleString("en-PK")} by {job.pendingOffer.by}</span>}
            {job.agreedPrice != null && <span>Agreed Rs {job.agreedPrice.toLocaleString("en-PK")}</span>}
            {needsAction && <span className="rounded-full bg-danger px-2 py-0.5 font-semibold text-white">Your turn</span>}
          </div>
        </div>
        <ChevronRight className="size-5 text-muted" />
      </Link>
    </li>
  );
}

function JobsList() {
  const jobs = useBrowseStore((s) => s.myJobs);
  const poll = useBrowseStore((s) => s.pollMyJobs);
  const user = useSessionStore((s) => s.me?.user);
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
        <h1 className="text-xl font-bold">My jobs</h1>
        <Link href="/customer" className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-white">
          <Plus className="size-4" /> New request
        </Link>
      </div>
      {jobs.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm ring-1 ring-line">No jobs yet.</p>}
      {open.length > 0 && (
        <ul className="flex flex-col gap-2">
          {open.map((j) => (
            <JobRow key={j.id} job={j} />
          ))}
        </ul>
      )}
      {past.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted">Past</h2>
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
