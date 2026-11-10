import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { after } from "next/server";
import type { z } from "zod";
import { db } from "@/server/db";
import { jobs, media, messages, reviews, user, workers, type Job, type Message } from "@/db/schema";
import { HttpError } from "@/server/http";
import { haversineKm } from "@/lib/geo";
import { mediaUrl, type JobDTO, type JobStatus, type MessageDTO, type OfferDTO } from "@/lib/types";
import type { TradeId } from "@/lib/trades";
import type { createJobsInput, postMessageInput, reviewInput } from "@/lib/validation";
import { assistMessage, transcribeAudio } from "@/server/ai/tasks";
import { refreshWorkerTrust } from "@/server/services/workers";

type Viewer = { id: string; name: string };
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const OPEN_STATUSES = ["requested", "booked"] as const;

/* ------------------------------------------------------------------ */
/* Read models                                                         */
/* ------------------------------------------------------------------ */

async function loadJobRows(where: ReturnType<typeof and>) {
  return db
    .select({
      job: jobs,
      worker: workers,
      customerName: user.name,
      customerPhone: user.phoneNumber,
      workerPhone: sql<string | null>`(select wu.phone_number from "user" wu where wu.id = "workers"."user_id")`,
      hasReview: sql<boolean>`exists (select 1 from reviews rv where rv.job_id = "jobs"."id")`,
    })
    .from(jobs)
    .innerJoin(workers, eq(workers.id, jobs.workerId))
    .innerJoin(user, eq(user.id, jobs.customerId))
    .where(where)
    .orderBy(desc(jobs.updatedAt));
}

async function pendingOffers(jobIds: string[]): Promise<Map<string, OfferDTO>> {
  const out = new Map<string, OfferDTO>();
  if (!jobIds.length) return out;
  const rows = await db
    .select()
    .from(messages)
    .where(and(inArray(messages.jobId, jobIds), eq(messages.kind, "offer"), eq(messages.offerStatus, "pending")))
    .orderBy(desc(messages.createdAt));
  for (const m of rows) {
    if (!out.has(m.jobId) && m.offerAmount != null) {
      out.set(m.jobId, {
        messageId: m.id,
        amount: m.offerAmount,
        by: m.senderRole as "customer" | "worker",
        createdAt: m.createdAt.toISOString(),
      });
    }
  }
  return out;
}

function toJobDTO(
  r: Awaited<ReturnType<typeof loadJobRows>>[number],
  viewerRole: "customer" | "worker",
  offer: OfferDTO | null,
): JobDTO {
  const { job, worker } = r;
  // Phone numbers are only revealed to each other once the job is booked.
  const reveal = job.status === "booked" || job.status === "completed";
  return {
    id: job.id,
    groupId: job.groupId,
    status: job.status as JobStatus,
    closeReason: job.closeReason,
    trade: job.trade as TradeId,
    problemText: job.problemText,
    summaryEn: job.summaryEn,
    summaryUr: job.summaryUr,
    triageSource: job.triageSource,
    photoUrl: mediaUrl(job.photoMediaId),
    areaId: job.areaId,
    addressNote: reveal ? job.addressNote : null,
    lat: job.lat,
    lng: job.lng,
    distanceKm: job.distanceKm,
    agreedPrice: job.agreedPrice,
    bookedAt: job.bookedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    viewerRole,
    customer: { name: r.customerName, phone: reveal ? r.customerPhone : null },
    worker: {
      id: worker.id,
      name: worker.name,
      nameUr: worker.nameUr,
      photoUrl: mediaUrl(worker.photoMediaId),
      ratingAvg: worker.ratingAvg,
      ratingCount: worker.ratingCount,
      visitCharge: worker.visitCharge,
      phone: reveal ? r.workerPhone : null,
    },
    pendingOffer: job.status === "requested" ? offer : null,
    hasReview: r.hasReview,
  };
}

function toMessageDTO(m: Message, viewerId: string): MessageDTO {
  return {
    id: m.id,
    senderRole: m.senderRole as MessageDTO["senderRole"],
    kind: m.kind as MessageDTO["kind"],
    text: m.text,
    audioUrl: mediaUrl(m.audioMediaId),
    textEn: m.textEn,
    textUr: m.textUr,
    aiSource: m.aiSource,
    offerAmount: m.offerAmount,
    offerStatus: m.offerStatus,
    createdAt: m.createdAt.toISOString(),
    mine: m.senderUserId === viewerId,
  };
}

async function jobsToDTOs(rows: Awaited<ReturnType<typeof loadJobRows>>, viewerRole: "customer" | "worker") {
  const offers = await pendingOffers(rows.map((r) => r.job.id));
  return rows.map((r) => toJobDTO(r, viewerRole, offers.get(r.job.id) ?? null));
}

/** Resolve the job and the viewer's role in it, or 404. */
async function jobForViewer(jobId: string, viewer: Viewer) {
  const [row] = await loadJobRows(and(eq(jobs.id, jobId)));
  if (!row) throw new HttpError(404, "Job not found");
  if (row.job.customerId === viewer.id) return { row, role: "customer" as const };
  if (row.worker.userId === viewer.id) return { row, role: "worker" as const };
  throw new HttpError(404, "Job not found");
}

export async function getJobThread(jobId: string, viewer: Viewer) {
  const { row, role } = await jobForViewer(jobId, viewer);
  const offers = await pendingOffers([jobId]);
  const msgs = await db.select().from(messages).where(eq(messages.jobId, jobId)).orderBy(asc(messages.createdAt));
  return {
    job: toJobDTO(row, role, offers.get(jobId) ?? null),
    messages: msgs.map((m) => toMessageDTO(m, viewer.id)),
  };
}

export async function listCustomerJobs(customerId: string) {
  const rows = await loadJobRows(and(eq(jobs.customerId, customerId), eq(jobs.isSeeded, false)));
  return jobsToDTOs(rows.slice(0, 50), "customer");
}

export async function workerInbox(workerId: string) {
  const rows = await loadJobRows(
    and(eq(jobs.workerId, workerId), or(eq(jobs.status, "requested"), eq(jobs.status, "booked"))),
  );
  const recentRows = await loadJobRows(
    and(eq(jobs.workerId, workerId), eq(jobs.status, "completed"), eq(jobs.isSeeded, false)),
  );
  const dtos = await jobsToDTOs([...rows, ...recentRows.slice(0, 5)], "worker");
  return {
    active: dtos.find((j) => j.status === "booked") ?? null,
    requests: dtos.filter((j) => j.status === "requested"),
    recent: dtos.filter((j) => j.status === "completed"),
  };
}

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */

async function systemMessage(tx: Tx, jobId: string, textEn: string, textUr: string) {
  await tx.insert(messages).values({ jobId, senderRole: "system", kind: "system", text: textEn, textEn, textUr });
}

export async function createJobRequests(customer: Viewer, input: z.infer<typeof createJobsInput>) {
  const ws = await db
    .select({
      w: workers,
      engaged: sql<boolean>`exists (select 1 from jobs j where j.worker_id = "workers"."id" and j.status = 'booked')`,
      alreadyOpen: sql<boolean>`exists (select 1 from jobs j where j.worker_id = "workers"."id" and j.customer_id = ${customer.id} and j.status in ('requested','booked'))`,
    })
    .from(workers)
    .where(inArray(workers.id, input.workerIds));

  const usable = ws.filter((x) => x.w.isOnline && !x.engaged && !x.alreadyOpen && x.w.userId !== customer.id);
  if (!usable.length) {
    throw new HttpError(409, "These workers are no longer available. Please pick someone else.", "workers_unavailable");
  }
  const groupId = randomUUID();

  const created = await db.transaction(async (tx) => {
    const ids: string[] = [];
    for (const { w } of usable) {
      const [job] = await tx
        .insert(jobs)
        .values({
          groupId,
          customerId: customer.id,
          workerId: w.id,
          trade: input.trade,
          problemText: input.problemText,
          summaryEn: input.summaryEn ?? null,
          summaryUr: input.summaryUr ?? null,
          triageSource: input.triageSource ?? null,
          photoMediaId: input.photoMediaId ?? null,
          areaId: input.areaId,
          addressNote: input.addressNote ?? null,
          lat: input.lat,
          lng: input.lng,
          distanceKm: Math.round(haversineKm(input.lat, input.lng, w.lat, w.lng) * 10) / 10,
        })
        .returning({ id: jobs.id });
      ids.push(job.id);
      await systemMessage(tx, job.id, `${customer.name} sent a job request.`, `${customer.name} نے کام کی درخواست بھیجی۔`);
      const amount = input.offerAmount ?? null;
      if (amount) {
        await tx.insert(messages).values({
          jobId: job.id,
          senderUserId: customer.id,
          senderRole: "customer",
          kind: "offer",
          offerAmount: amount,
          offerStatus: "pending",
          textEn: `Offer: Rs ${amount}`,
          textUr: `پیشکش: ${amount} روپے`,
        });
      }
    }
    return ids;
  });
  return { groupId, jobIds: created, skipped: ws.length - usable.length };
}

async function supersedePendingOffers(tx: Tx, jobId: string) {
  await tx
    .update(messages)
    .set({ offerStatus: "superseded" })
    .where(and(eq(messages.jobId, jobId), eq(messages.kind, "offer"), eq(messages.offerStatus, "pending")));
}

export async function postMessage(jobId: string, viewer: Viewer, input: z.infer<typeof postMessageInput>) {
  const { row, role } = await jobForViewer(jobId, viewer);
  const status = row.job.status as JobStatus;
  if (status !== "requested" && status !== "booked") throw new HttpError(409, "This job is closed", "job_closed");

  if (input.kind === "offer") {
    if (status !== "requested") throw new HttpError(409, "Price is already agreed", "already_booked");
    if (!input.offerAmount) throw new HttpError(400, "Offer amount required");
    const amount = input.offerAmount;
    await db.transaction(async (tx) => {
      await supersedePendingOffers(tx, jobId);
      await tx.insert(messages).values({
        jobId,
        senderUserId: viewer.id,
        senderRole: role,
        kind: "offer",
        offerAmount: amount,
        offerStatus: "pending",
        textEn: `Offer: Rs ${amount}`,
        textUr: `پیشکش: ${amount} روپے`,
      });
    });
    return { detectedOffer: amount, aiSource: null as string | null };
  }

  // Text or voice. Voice notes arrive with the browser's speech-recognition transcript;
  // if the browser couldn't transcribe, fall back to server-side speech-to-text.
  let text = input.text?.trim() || null;
  let transcribedBy: string | null = null;
  if (input.kind === "voice" && !input.audioMediaId) throw new HttpError(400, "Voice note missing");
  if (input.kind === "voice" && !text && input.audioMediaId) {
    const [m] = await db.select().from(media).where(eq(media.id, input.audioMediaId)).limit(1);
    if (m) {
      const t = await transcribeAudio({ data: m.data, mediaType: m.mime });
      if (t.ok && t.data.transcript) {
        text = t.data.transcript;
        transcribedBy = "ai";
      }
    }
  }
  if (input.kind === "text" && !text) throw new HttpError(400, "Empty message");

  const assist = text ? await assistMessage({ text, senderRole: role, trade: row.job.trade }) : null;
  const detected =
    status === "requested" && assist?.data.offerAmount && assist.data.offerAmount >= 100
      ? Math.round(assist.data.offerAmount)
      : null;

  await db.transaction(async (tx) => {
    await tx.insert(messages).values({
      jobId,
      senderUserId: viewer.id,
      senderRole: role,
      kind: input.kind,
      text,
      audioMediaId: input.audioMediaId ?? null,
      textEn: assist?.data.textEn || null,
      textUr: assist?.data.textUr || null,
      aiSource: assist?.source ?? transcribedBy,
    });
    if (detected) {
      // The AI heard a price in the message: turn it into a one-tap offer card.
      await supersedePendingOffers(tx, jobId);
      await tx.insert(messages).values({
        jobId,
        senderUserId: viewer.id,
        senderRole: role,
        kind: "offer",
        offerAmount: detected,
        offerStatus: "pending",
        aiSource: assist?.source ?? null,
        textEn: `Offer: Rs ${detected}`,
        textUr: `پیشکش: ${detected} روپے`,
      });
    }
    await tx.update(jobs).set({ updatedAt: new Date() }).where(eq(jobs.id, jobId));
  });
  return { detectedOffer: detected, aiSource: assist?.source ?? null };
}

/**
 * Accept the other side's pending offer => the job is BOOKED.
 * Consistency guarantees (all inside one transaction):
 *  - the worker row is locked (SELECT ... FOR UPDATE) so concurrent bookings serialise;
 *  - a partial unique index (one 'booked' job per worker) is the last line of defence;
 *  - the worker's other open requests are expired ("worker became busy");
 *  - the customer's parallel requests for the same problem are cancelled.
 */
export async function acceptOffer(jobId: string, viewer: Viewer, messageId: string) {
  const { role } = await jobForViewer(jobId, viewer);
  try {
    return await db.transaction(async (tx) => {
      const [job] = await tx.select().from(jobs).where(eq(jobs.id, jobId)).for("update");
      if (!job) throw new HttpError(404, "Job not found");
      if (job.status !== "requested") throw new HttpError(409, `Job is already ${job.status}`, "not_requested");

      const [offer] = await tx
        .select()
        .from(messages)
        .where(and(eq(messages.id, messageId), eq(messages.jobId, jobId)))
        .limit(1);
      if (!offer || offer.kind !== "offer" || offer.offerStatus !== "pending" || offer.offerAmount == null)
        throw new HttpError(409, "This offer is no longer valid", "offer_stale");
      if (offer.senderRole === role) throw new HttpError(409, "You cannot accept your own offer", "own_offer");

      await tx.select({ id: workers.id }).from(workers).where(eq(workers.id, job.workerId)).for("update");
      const [busy] = await tx
        .select({ id: jobs.id })
        .from(jobs)
        .where(and(eq(jobs.workerId, job.workerId), eq(jobs.status, "booked")))
        .limit(1);
      if (busy) {
        await tx.update(jobs).set({ status: "expired", closeReason: "worker_busy" }).where(eq(jobs.id, jobId));
        throw new HttpError(409, "This worker was just booked by someone else.", "worker_busy");
      }

      const now = new Date();
      await tx
        .update(jobs)
        .set({ status: "booked", agreedPrice: offer.offerAmount, bookedAt: now })
        .where(eq(jobs.id, jobId));
      await tx
        .update(messages)
        .set({ offerStatus: "accepted" })
        .where(eq(messages.id, offer.id));
      await tx
        .update(messages)
        .set({ offerStatus: "superseded" })
        .where(and(eq(messages.jobId, jobId), eq(messages.kind, "offer"), eq(messages.offerStatus, "pending")));
      await systemMessage(
        tx,
        jobId,
        `Booked at Rs ${offer.offerAmount}. Phone numbers are now shared.`,
        `${offer.offerAmount} روپے پر کام پکا ہو گیا۔ اب فون نمبر نظر آ رہے ہیں۔`,
      );

      // Worker is now engaged: close their other open requests.
      const others = await tx
        .update(jobs)
        .set({ status: "expired", closeReason: "worker_busy" })
        .where(and(eq(jobs.workerId, job.workerId), eq(jobs.status, "requested"), ne(jobs.id, jobId)))
        .returning({ id: jobs.id });
      for (const o of others)
        await systemMessage(tx, o.id, "This worker just got booked on another job. Please choose another worker.", "یہ کاریگر دوسرے کام پر چلا گیا ہے۔");

      // Customer hired this worker: cancel their parallel requests for the same problem.
      const siblings = await tx
        .update(jobs)
        .set({ status: "cancelled", closeReason: "customer_hired_other" })
        .where(and(eq(jobs.groupId, job.groupId), eq(jobs.status, "requested"), ne(jobs.id, jobId)))
        .returning({ id: jobs.id });
      for (const s of siblings)
        await systemMessage(tx, s.id, "The customer hired another worker for this job.", "گاہک نے یہ کام کسی اور کو دے دیا۔");

      return { status: "booked" as const, agreedPrice: offer.offerAmount };
    });
  } catch (e) {
    // 23505 = unique violation on jobs_one_active_booking_per_worker (a racing booking won).
    if ((e as { code?: string })?.code === "23505" || (e as { cause?: { code?: string } })?.cause?.code === "23505")
      throw new HttpError(409, "This worker was just booked by someone else.", "worker_busy");
    throw e;
  }
}

export async function closeJob(jobId: string, viewer: Viewer, action: "decline" | "cancel") {
  const { row, role } = await jobForViewer(jobId, viewer);
  const status = row.job.status as JobStatus;
  if (status !== "requested" && status !== "booked") throw new HttpError(409, "Job is already closed");
  if (action === "decline" && role !== "worker") throw new HttpError(403, "Only the worker can decline");
  const next: JobStatus = action === "decline" ? "declined" : "cancelled";
  await db.transaction(async (tx) => {
    await tx
      .update(jobs)
      .set({ status: next, closeReason: `${role}_${action}` })
      .where(and(eq(jobs.id, jobId), inArray(jobs.status, [...OPEN_STATUSES])));
    await supersedePendingOffers(tx, jobId);
    if (action === "decline")
      await systemMessage(tx, jobId, "The worker can't take this job.", "کاریگر نے یہ کام نہیں لیا۔");
    else
      await systemMessage(
        tx,
        jobId,
        `The ${role} cancelled this job.`,
        role === "customer" ? "گاہک نے کام منسوخ کر دیا۔" : "کاریگر نے کام منسوخ کر دیا۔",
      );
  });
  return { status: next };
}

export async function completeJob(jobId: string, viewer: Viewer) {
  const { row } = await jobForViewer(jobId, viewer);
  if (row.job.status !== "booked") throw new HttpError(409, "Only a booked job can be completed");
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(jobs)
      .set({ status: "completed", completedAt: new Date() })
      .where(and(eq(jobs.id, jobId), eq(jobs.status, "booked")))
      .returning({ id: jobs.id });
    if (!updated.length) throw new HttpError(409, "Job state changed, refresh");
    await tx
      .update(workers)
      .set({ jobsCompleted: sql`${workers.jobsCompleted} + 1` })
      .where(eq(workers.id, row.job.workerId));
    await systemMessage(tx, jobId, "Job marked as done. The worker is free for new jobs.", "کام مکمل ہو گیا۔ کاریگر اب نئے کام کے لیے فارغ ہے۔");
  });
  return { status: "completed" as const };
}

export async function submitReview(jobId: string, viewer: Viewer, input: z.infer<typeof reviewInput>) {
  const { row, role } = await jobForViewer(jobId, viewer);
  if (role !== "customer") throw new HttpError(403, "Only the customer can review");
  if (row.job.status !== "completed") throw new HttpError(409, "You can review after the job is done");
  try {
    await db.insert(reviews).values({
      jobId,
      workerId: row.job.workerId,
      customerId: viewer.id,
      customerName: viewer.name.split(" ")[0] || "Customer",
      rating: input.rating,
      tags: input.tags,
      paidAgreedPrice: input.paidAgreedPrice ?? null,
      wouldHireAgain: input.wouldHireAgain ?? null,
      comment: input.comment || null,
      agreedPrice: row.job.agreedPrice,
    });
  } catch (e) {
    if ((e as { code?: string })?.code === "23505" || (e as { cause?: { code?: string } })?.cause?.code === "23505")
      throw new HttpError(409, "Already reviewed");
    throw e;
  }
  // Rating stats + AI trust summary are refreshed after the response is sent.
  after(() => refreshWorkerTrust(row.job.workerId));
  return { ok: true };
}

export type { Job };
