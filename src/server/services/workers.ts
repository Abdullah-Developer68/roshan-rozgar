import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { jobs, reviews, user, workers, type Worker } from "@/db/schema";
import { etaMinutes } from "@/lib/geo";
import { getArea } from "@/lib/areas";
import { TRADES, type TradeId } from "@/lib/trades";
import {
  mediaUrl,
  type Availability,
  type PriceStats,
  type ReviewDTO,
  type WorkerPublic,
  type WorkerSearchResult,
} from "@/lib/types";
import { HttpError } from "@/server/http";
import { summarizeReviews } from "@/server/ai/tasks";
import type { z } from "zod";
import type { workerProfileInput } from "@/lib/validation";

export function availabilityOf(w: Pick<Worker, "isOnline">, engaged: boolean): Availability {
  if (engaged) return "busy";
  return w.isOnline ? "available" : "offline";
}

export function toWorkerPublic(w: Worker, engaged: boolean): WorkerPublic {
  return {
    id: w.id,
    name: w.name,
    nameUr: w.nameUr,
    trade: w.trade as TradeId,
    skills: w.skills,
    experienceYears: w.experienceYears,
    areaId: w.areaId,
    lat: w.lat,
    lng: w.lng,
    visitCharge: w.visitCharge,
    bioUr: w.bioUr,
    bioEn: w.bioEn,
    photoUrl: mediaUrl(w.photoMediaId),
    voiceIntroUrl: mediaUrl(w.voiceIntroMediaId),
    isOnline: w.isOnline,
    availability: availabilityOf(w, engaged),
    ratingAvg: w.ratingAvg,
    ratingCount: w.ratingCount,
    jobsCompleted: w.jobsCompleted,
    trustSummaryEn: w.trustSummaryEn,
    trustSummaryUr: w.trustSummaryUr,
    trustTags: w.trustTags,
    trustSummarySource: w.trustSummarySource,
    memberSince: w.createdAt.toISOString(),
    isSeeded: w.isSeeded,
  };
}

/** SQL expression: does this worker currently have a booked (engaged) job? */
// NB: correlated subqueries use explicit, qualified identifiers — Drizzle renders columns
// unqualified in single-table selects, which would silently bind to the inner table.
const engagedExpr = sql<boolean>`exists (select 1 from jobs ej where ej.worker_id = "workers"."id" and ej.status = 'booked')`;

export async function isWorkerEngaged(workerId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.workerId, workerId), eq(jobs.status, "booked")))
    .limit(1);
  return !!row;
}

export async function getWorkerPublic(workerId: string): Promise<WorkerPublic | null> {
  const [row] = await db
    .select({ w: workers, engaged: engagedExpr })
    .from(workers)
    .where(eq(workers.id, workerId))
    .limit(1);
  return row ? toWorkerPublic(row.w, row.engaged) : null;
}

export async function getWorkerReviews(workerId: string, limit = 20): Promise<ReviewDTO[]> {
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.workerId, workerId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    tags: r.tags,
    comment: r.comment,
    customerName: r.customerName,
    paidAgreedPrice: r.paidAgreedPrice,
    wouldHireAgain: r.wouldHireAgain,
    agreedPrice: r.agreedPrice,
    createdAt: r.createdAt.toISOString(),
    isSeeded: r.isSeeded,
  }));
}

/**
 * Nearby workers of a trade. Available workers are ranked first by a blend of
 * Bayesian-smoothed rating, distance, verified job count and experience.
 * Busy/offline workers are still returned (shown greyed out) so the customer
 * can see the platform's availability is live.
 */
export async function searchWorkers(input: {
  trade: TradeId;
  lat: number;
  lng: number;
  radiusKm: number;
}): Promise<WorkerSearchResult[]> {
  const distance = sql<number>`(6371 * 2 * asin(sqrt(
      power(sin(radians(${workers.lat} - ${input.lat}) / 2), 2) +
      cos(radians(${input.lat})) * cos(radians(${workers.lat})) *
      power(sin(radians(${workers.lng} - ${input.lng}) / 2), 2))))`;

  const rows = await db
    .select({ w: workers, engaged: engagedExpr, distanceKm: distance })
    .from(workers)
    .where(and(eq(workers.trade, input.trade), sql`${distance} <= ${input.radiusKm}`))
    .orderBy(distance)
    .limit(60);

  const results = rows.map(({ w, engaged, distanceKm }) => {
    const d = Number(distanceKm);
    const bayes = (w.ratingAvg * w.ratingCount + 4 * 3) / (w.ratingCount + 3);
    const score =
      bayes * 20 - d * 4 + Math.min(w.jobsCompleted, 60) * 0.25 + Math.min(w.experienceYears, 20) * 0.3;
    return {
      ...toWorkerPublic(w, engaged),
      distanceKm: Math.round(d * 10) / 10,
      etaMin: etaMinutes(d),
      score: Math.round(score * 10) / 10,
    };
  });
  const rank = { available: 0, busy: 1, offline: 2 } as const;
  return results.sort((a, b) => rank[a.availability] - rank[b.availability] || b.score - a.score);
}

/** Price distribution of completed jobs for a trade — shown to both sides as an anchor. */
export async function priceStats(trade: TradeId): Promise<PriceStats> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      p25: sql<number | null>`percentile_cont(0.25) within group (order by ${jobs.agreedPrice})`,
      median: sql<number | null>`percentile_cont(0.5) within group (order by ${jobs.agreedPrice})`,
      p75: sql<number | null>`percentile_cont(0.75) within group (order by ${jobs.agreedPrice})`,
    })
    .from(jobs)
    .where(and(eq(jobs.trade, trade), eq(jobs.status, "completed"), sql`${jobs.agreedPrice} is not null`));
  const round = (v: number | null) => (v == null ? null : Math.round(Number(v) / 50) * 50);
  return { count: row?.count ?? 0, p25: round(row?.p25 ?? null), median: round(row?.median ?? null), p75: round(row?.p75 ?? null) };
}

export async function upsertWorkerProfile(userId: string, input: z.infer<typeof workerProfileInput>) {
  const area = getArea(input.areaId);
  const values = {
    name: input.name,
    nameUr: input.nameUr ?? null,
    trade: input.trade,
    skills: input.skills,
    experienceYears: input.experienceYears,
    areaId: area.id,
    // Use GPS if the worker shared it, otherwise the area's centre.
    lat: input.lat ?? area.lat,
    lng: input.lng ?? area.lng,
    visitCharge: input.visitCharge,
    bioUr: input.bioUr ?? null,
    bioEn: input.bioEn ?? null,
    photoMediaId: input.photoMediaId ?? null,
    voiceIntroMediaId: input.voiceIntroMediaId ?? null,
    onboardingTranscript: input.transcript ?? null,
  };
  return db.transaction(async (tx) => {
    const [w] = await tx
      .insert(workers)
      .values({ userId, ...values, isOnline: true })
      .onConflictDoUpdate({ target: workers.userId, set: values })
      .returning();
    await tx.update(user).set({ role: "worker", name: input.name }).where(eq(user.id, userId));
    return w;
  });
}

export async function setWorkerOnline(workerId: string, isOnline: boolean) {
  const [w] = await db
    .update(workers)
    .set({ isOnline, lastActiveAt: new Date() })
    .where(eq(workers.id, workerId))
    .returning();
  if (!w) throw new HttpError(404, "Worker not found");
  return w;
}

/** Recompute rating stats and regenerate the AI trust summary from all reviews. */
export async function refreshWorkerTrust(workerId: string) {
  const [w] = await db.select().from(workers).where(eq(workers.id, workerId)).limit(1);
  if (!w) return;
  const all = await db
    .select()
    .from(reviews)
    .where(eq(reviews.workerId, workerId))
    .orderBy(desc(reviews.createdAt));
  const count = all.length;
  const avg = count ? all.reduce((s, r) => s + r.rating, 0) / count : 0;
  const [{ completed }] = await db
    .select({ completed: sql<number>`count(*)::int` })
    .from(jobs)
    .where(and(eq(jobs.workerId, workerId), eq(jobs.status, "completed")));

  let summary: { summaryEn: string; summaryUr: string; tags: string[] } | null = null;
  let source: string | null = null;
  if (count > 0) {
    const res = await summarizeReviews({ tradeEn: TRADES[w.trade as TradeId]?.en ?? w.trade, reviews: all });
    summary = res.data;
    source = res.source;
  }
  await db
    .update(workers)
    .set({
      ratingAvg: Math.round(avg * 100) / 100,
      ratingCount: count,
      jobsCompleted: completed,
      ...(summary
        ? {
            trustSummaryEn: summary.summaryEn,
            trustSummaryUr: summary.summaryUr,
            trustTags: summary.tags.slice(0, 5),
            trustSummarySource: source,
          }
        : {}),
    })
    .where(eq(workers.id, workerId));
}

export async function workersByIds(ids: string[]) {
  if (!ids.length) return [];
  return db.select({ w: workers, engaged: engagedExpr }).from(workers).where(inArray(workers.id, ids));
}
