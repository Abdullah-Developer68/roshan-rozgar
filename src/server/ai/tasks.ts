import "server-only";
import { aiObject, isSupportedAudio, type AiPart } from "@/server/ai/client";
import {
  messageAssistSchema,
  messageAssistWire,
  reviewSummarySchema,
  reviewSummaryWire,
  transcriptSchema,
  transcriptWire,
  triageSchema,
  triageWire,
  workerProfileSchema,
  workerProfileWire,
} from "@/server/ai/schemas";
import type { z } from "zod";
import { TRADES, TRADE_IDS, classifyTradeByKeywords, isTradeId, type TradeId } from "@/lib/trades";
import { AREAS, matchArea } from "@/lib/areas";
import { extractMoney, extractYears } from "@/lib/numbers";

export type Source = "ai" | "fallback";

const URDU_RULE =
  "All fields ending in Ur MUST be written entirely in Urdu (Arabic/Nastaliq) script — never Roman Urdu, and never Hindi/Devanagari characters.";

const AREA_HINT = AREAS.map((a) => a.en).join(", ");
const TRADE_HINT = TRADE_IDS.map((id) => `${id} (${TRADES[id].en}, ${TRADES[id].ur})`).join("; ");

/* ------------------------------------------------------------------ */
/* 1. Worker onboarding: spoken self-introduction -> structured profile */
/* ------------------------------------------------------------------ */

export type WorkerProfileDraft = z.infer<typeof workerProfileSchema> & { areaId: string | null };

export async function extractWorkerProfile(
  transcript: string,
): Promise<{ data: WorkerProfileDraft; source: Source; note?: string }> {
  const res = await aiObject({
    task: "worker_profile_v2",
    chain: "text",
    wire: workerProfileWire,
    schema: workerProfileSchema,
    system: `You help low-literacy Pakistani tradespeople build a work profile by speaking. The input is a speech-recognition transcript in Urdu, Roman Urdu, Punjabi or English and may contain recognition mistakes; interpret it charitably.
Return a JSON object:
{"name": string|null (Latin script), "nameUr": string|null (Urdu script), "trade": one of [${TRADE_IDS.join(", ")}] or null, "skills": string[] (2-6 short English skill phrases), "experienceYears": number|null, "area": string|null (neighbourhood as spoken; known areas: ${AREA_HINT}), "visitCharge": number|null (PKR visit/inspection fee), "bioUr": string (one short, simple Urdu sentence describing the worker, 20 words max), "bioEn": string (same in English)}
Trades: ${TRADE_HINT}. Convert spoken numbers to digits (e.g. پندرہ سو = 1500). Do not invent facts that were not said; use null. ${URDU_RULE}`,
    content: transcript,
  });

  const areaFromTranscript = matchArea(transcript);
  if (res.ok) {
    const d = res.data;
    const area = matchArea(d.area) ?? areaFromTranscript;
    return { data: { ...d, areaId: area?.id ?? null }, source: "ai" };
  }
  return { data: fallbackWorkerProfile(transcript), source: "fallback", note: res.error };
}

function fallbackWorkerProfile(transcript: string): WorkerProfileDraft {
  const nameMatch =
    transcript.match(/(?:mera naam|mera nam|my name is|main)\s+([a-z][a-z]+(?:\s+[a-z][a-z]+)?)/i) ??
    transcript.match(/میرا نام\s+([؀-ۿ]+(?:\s+[؀-ۿ]+)?)\s+ہے/);
  const name = nameMatch?.[1]?.trim() ?? null;
  const isUrdu = name ? /[؀-ۿ]/.test(name) : false;
  const { trade } = classifyTradeByKeywords(transcript);
  const area = matchArea(transcript);
  return {
    name: isUrdu ? null : name,
    nameUr: isUrdu ? name : null,
    trade,
    skills: [],
    experienceYears: extractYears(transcript),
    area: area?.en ?? null,
    areaId: area?.id ?? null,
    visitCharge: extractMoney(transcript),
    bioUr: "",
    bioEn: "",
  };
}

/* ------------------------------------------------------------------ */
/* 2. Customer problem triage: text / voice transcript / photo        */
/* ------------------------------------------------------------------ */

export type Triage = z.infer<typeof triageSchema>;

export async function triageProblem(input: {
  text: string;
  image?: { data: Buffer; mediaType: string } | null;
}): Promise<{ data: Triage; source: Source; note?: string }> {
  const content: AiPart[] = [{ type: "text", text: input.text || "(no text — see photo)" }];
  if (input.image) content.push({ type: "image", data: input.image.data, mediaType: input.image.mediaType });

  const res = await aiObject({
    task: "triage_v2",
    chain: input.image ? "vision" : "text",
    wire: triageWire,
    schema: triageSchema,
    timeoutMs: 40_000,
    system: `You triage household repair requests in Islamabad/Rawalpindi, Pakistan. The customer may write or speak in English, Urdu or Roman Urdu, and may attach a photo of the problem.
Decide which tradesperson is needed and describe the job so a worker who reads only simple Urdu understands it.
Return JSON: {"trade": one of [${TRADE_IDS.join(", ")}] or null, "summaryEn": string (one sentence, what is wrong + what work is likely needed), "summaryUr": string (same, simple Urdu), "urgency": "low"|"normal"|"urgent" (urgent = safety risk, water flooding, sparking, no power), "estimateMin": number (PKR, typical labour cost in 2026 Islamabad), "estimateMax": number, "safetyTipEn": string|null (one short safety step while waiting, only if relevant), "safetyTipUr": string|null}
Trades: ${TRADE_HINT}. ${URDU_RULE}`,
    content,
  });
  if (res.ok) return { data: res.data, source: "ai" };

  const { trade } = classifyTradeByKeywords(input.text);
  const band = trade ? TRADES[trade].priceBand : null;
  return {
    data: {
      trade,
      summaryEn: input.text.slice(0, 280),
      summaryUr: "",
      urgency: /spark|fire|aag|آگ|flood|current|کرنٹ|short/i.test(input.text) ? "urgent" : "normal",
      estimateMin: band?.[0] ?? null,
      estimateMax: band?.[1] ?? null,
      safetyTipEn: null,
      safetyTipUr: null,
    },
    source: "fallback",
    note: res.error,
  };
}

/* ------------------------------------------------------------------ */
/* 3. Chat message assist: transcribed voice/text -> translations +   */
/*    detected price offer                                             */
/* ------------------------------------------------------------------ */

export type MessageAssist = z.infer<typeof messageAssistSchema>;

export async function assistMessage(input: {
  text: string;
  senderRole: "customer" | "worker";
  trade: TradeId | string;
}): Promise<{ data: MessageAssist; source: Source; note?: string }> {
  const res = await aiObject({
    task: "message_assist_v2",
    chain: "text",
    wire: messageAssistWire,
    schema: messageAssistSchema,
    maxTokens: 500,
    system: `You relay chat messages between a household customer and a ${String(trade(input.trade))} in Pakistan. The worker reads only simple Urdu (and listens to it read aloud); the customer reads English. The message may be a speech-recognition transcript in Urdu, Roman Urdu or English with mistakes.
Return JSON: {"textEn": string (clear English rendering), "textUr": string (simple Urdu script rendering), "offerAmount": number|null (PKR amount ONLY if the sender is proposing or quoting a price for this job, else null)} ${URDU_RULE}`,
    content: `Sender: ${input.senderRole}\nMessage: ${input.text}`,
  });
  if (res.ok) return { data: res.data, source: "ai" };
  const isUrdu = /[؀-ۿ]/.test(input.text);
  return {
    data: {
      textEn: isUrdu ? "" : input.text,
      textUr: isUrdu ? input.text : "",
      offerAmount: extractMoney(input.text),
    },
    source: "fallback",
    note: res.error,
  };
}

function trade(t: string): string {
  return isTradeId(t) ? TRADES[t].en.toLowerCase() : "tradesperson";
}

/* ------------------------------------------------------------------ */
/* 4. Trust summary over a worker's reviews                            */
/* ------------------------------------------------------------------ */

export async function summarizeReviews(input: {
  tradeEn: string;
  reviews: { rating: number; tags: string[]; comment: string | null; paidAgreedPrice: boolean | null }[];
}): Promise<{ data: z.infer<typeof reviewSummarySchema>; source: Source; note?: string }> {
  const lines = input.reviews
    .slice(0, 25)
    .map(
      (r, i) =>
        `${i + 1}. ${r.rating}/5; tags: ${r.tags.join(", ") || "-"}; paid agreed price: ${r.paidAgreedPrice === null ? "?" : r.paidAgreedPrice ? "yes" : "NO"}; comment: ${r.comment ?? "-"}`,
    )
    .join("\n");
  const res = await aiObject({
    task: "review_summary_v2",
    chain: "text",
    wire: reviewSummaryWire,
    schema: reviewSummarySchema,
    maxTokens: 500,
    system: `Summarise verified customer reviews of a ${input.tradeEn} so the next household can decide quickly whether to let them into their home. Be balanced: mention recurring complaints too. Return JSON: {"summaryEn": string (max 2 sentences), "summaryUr": string (same in simple Urdu), "tags": string[] (3-5 short English strengths or warnings, e.g. "On time", "Fair price", "Sometimes late")} ${URDU_RULE}`,
    content: lines,
  });
  if (res.ok) {
    const fb = fallbackReviewSummary(input.reviews);
    return { data: { ...res.data, summaryUr: res.data.summaryUr || fb.summaryUr }, source: "ai" };
  }
  return { data: fallbackReviewSummary(input.reviews), source: "fallback", note: res.error };
}

export function fallbackReviewSummary(
  reviews: { rating: number; tags: string[]; paidAgreedPrice: boolean | null }[],
) {
  const counts = new Map<string, number>();
  for (const r of reviews) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.length);
  const priceIssues = reviews.filter((r) => r.paidAgreedPrice === false).length;
  return {
    summaryEn: `Rated ${avg.toFixed(1)}/5 by ${reviews.length} verified customer${reviews.length === 1 ? "" : "s"}.${top.length ? ` Most mentioned: ${top.join(", ")}.` : ""}${priceIssues ? ` ${priceIssues} reported paying more than agreed.` : ""}`,
    summaryUr: `${reviews.length} تصدیق شدہ گاہکوں نے ${avg.toFixed(1)}/5 ریٹنگ دی۔`,
    tags: top,
  };
}

/* ------------------------------------------------------------------ */
/* 5. Server-side speech-to-text (fallback when the browser has no     */
/*    speech recognition, e.g. Firefox)                                */
/* ------------------------------------------------------------------ */

export async function transcribeAudio(input: { data: Buffer; mediaType: string }) {
  const mediaType = input.mediaType.split(";")[0];
  if (!isSupportedAudio(mediaType))
    return { ok: false as const, error: `Audio format ${mediaType} is not supported for server transcription`, quotaExhausted: false };
  return aiObject({
    task: "transcribe_v2",
    chain: "audio",
    wire: transcriptWire,
    schema: transcriptSchema,
    timeoutMs: 45_000,
    maxTokens: 600,
    system:
      'Transcribe the speech exactly. It is usually Urdu, Punjabi or English from Pakistan. Write Urdu in Urdu script. Return JSON: {"transcript": string, "language": "ur"|"en"|"pa"|"other"}',
    content: [
      { type: "text", text: "Transcribe this voice note." },
      { type: "audio", data: input.data, mediaType },
    ],
  });
}
