import "server-only";
import { z } from "zod";
import { TRADE_IDS, isTradeId } from "@/lib/trades";

/**
 * Two schemas per AI task:
 *  - `*Wire`: strict, JSON-Schema-friendly. Passed to the AI SDK's `Output.object()` so the model
 *    is constrained (OpenRouter `response_format: json_schema`) and the SDK validates the reply.
 *  - `*Schema`: lenient normaliser applied afterwards (and to salvaged replies when a free model
 *    drifts from the wire schema): coerces "1500" -> 1500, unknown trades -> null, and drops
 *    "Urdu" fields that came back in Roman script.
 */

/* ----------------------------- primitives ----------------------------- */

const nullableNum = z.preprocess(
  (v) => (v === "" || v === undefined ? null : typeof v === "string" ? Number(v.replace(/[^\d.]/g, "")) || null : v),
  z.number().nonnegative().nullable(),
);
const tradeField = z.preprocess(
  (v) => (typeof v === "string" && isTradeId(v.trim().toLowerCase()) ? v.trim().toLowerCase() : null),
  z.enum(TRADE_IDS).nullable(),
);
const strList = z.preprocess((v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []), z.array(z.string()));
const str = z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string());
const nullableStr = z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().nullable());
// Workers read/listen to Urdu script; free models sometimes answer in Roman Urdu. Drop those.
const hasUrduScript = (v: unknown) => typeof v === "string" && /[؀-ۿ]/.test(v);
const urduStr = z.preprocess((v) => (hasUrduScript(v) ? (v as string).trim() : ""), z.string());
const nullableUrduStr = z.preprocess((v) => (hasUrduScript(v) ? (v as string).trim() : null), z.string().nullable());

const wTrade = z.enum(TRADE_IDS).nullable();

/* --------------------- 1. worker profile from speech --------------------- */

export const workerProfileWire = z.object({
  name: z.string().nullable().describe("Worker's name in Latin script"),
  nameUr: z.string().nullable().describe("Worker's name in Urdu script"),
  trade: wTrade,
  skills: z.array(z.string()).describe("2-6 short English skill phrases"),
  experienceYears: z.number().nullable(),
  area: z.string().nullable().describe("Neighbourhood as spoken"),
  visitCharge: z.number().nullable().describe("Visit/inspection fee in PKR"),
  bioUr: z.string().describe("One short simple Urdu sentence, Urdu script"),
  bioEn: z.string(),
});

export const workerProfileSchema = z.object({
  name: nullableStr,
  nameUr: nullableUrduStr,
  trade: tradeField,
  skills: strList,
  experienceYears: nullableNum,
  area: nullableStr,
  visitCharge: nullableNum,
  bioUr: urduStr,
  bioEn: str,
});

/* ------------------------- 2. problem triage ------------------------- */

export const triageWire = z.object({
  trade: wTrade,
  summaryEn: z.string(),
  summaryUr: z.string().describe("Simple Urdu, Urdu script"),
  urgency: z.enum(["low", "normal", "urgent"]),
  estimateMin: z.number().nullable(),
  estimateMax: z.number().nullable(),
  safetyTipEn: z.string().nullable(),
  safetyTipUr: z.string().nullable(),
});

export const triageSchema = z.object({
  trade: tradeField,
  summaryEn: str,
  summaryUr: urduStr,
  urgency: z.preprocess((v) => (v === "urgent" || v === "low" ? v : "normal"), z.enum(["low", "normal", "urgent"])),
  estimateMin: nullableNum,
  estimateMax: nullableNum,
  safetyTipEn: nullableStr,
  safetyTipUr: nullableUrduStr,
});

/* ------------------- 3. chat message translate + price ------------------- */

export const messageAssistWire = z.object({
  textEn: z.string(),
  textUr: z.string().describe("Urdu script"),
  offerAmount: z.number().nullable().describe("PKR only if the sender proposes/quotes a price, else null"),
});

export const messageAssistSchema = z.object({
  textEn: str,
  textUr: urduStr,
  offerAmount: nullableNum,
});

/* ------------------------- 4. review summary ------------------------- */

export const reviewSummaryWire = z.object({
  summaryEn: z.string(),
  summaryUr: z.string().describe("Urdu script"),
  tags: z.array(z.string()).describe("3-5 short English strengths or warnings"),
});

export const reviewSummarySchema = z.object({
  summaryEn: str,
  summaryUr: urduStr,
  tags: strList,
});

/* ------------------------- 5. speech-to-text ------------------------- */

export const transcriptWire = z.object({
  transcript: z.string(),
  language: z.enum(["ur", "en", "pa", "other"]),
});

export const transcriptSchema = z.object({ transcript: str, language: str });
