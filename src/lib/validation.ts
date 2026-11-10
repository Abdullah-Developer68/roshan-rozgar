import { z } from "zod";
import { TRADE_IDS } from "@/lib/trades";
import { AREA_BY_ID } from "@/lib/areas";

export const tradeId = z.enum(TRADE_IDS);
export const areaId = z.string().refine((v) => v in AREA_BY_ID, "Unknown area");
const lat = z.number().min(23).max(37.5); // Pakistan bounding box
const lng = z.number().min(60).max(78);
const uuid = z.uuid();

export const workerProfileInput = z.object({
  name: z.string().trim().min(2).max(60),
  nameUr: z.string().trim().max(60).nullable().optional(),
  trade: tradeId,
  skills: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  experienceYears: z.number().int().min(0).max(60),
  areaId,
  lat: lat.nullable().optional(),
  lng: lng.nullable().optional(),
  visitCharge: z.number().int().min(0).max(50_000),
  bioUr: z.string().max(400).nullable().optional(),
  bioEn: z.string().max(400).nullable().optional(),
  photoMediaId: uuid.nullable().optional(),
  voiceIntroMediaId: uuid.nullable().optional(),
  transcript: z.string().max(4000).nullable().optional(),
});

export const extractProfileInput = z.object({ transcript: z.string().trim().min(3).max(4000) });

export const customerProfileInput = z.object({ name: z.string().trim().min(2).max(60) });

export const triageInput = z.object({
  text: z.string().trim().max(1500).default(""),
  photoMediaId: uuid.nullable().optional(),
});

export const searchInput = z.object({
  trade: tradeId,
  lat,
  lng,
  radiusKm: z.number().min(1).max(40).default(10),
});

export const createJobsInput = z.object({
  workerIds: z.array(uuid).min(1).max(3),
  trade: tradeId,
  problemText: z.string().trim().min(2).max(1500),
  summaryEn: z.string().max(600).nullable().optional(),
  summaryUr: z.string().max(600).nullable().optional(),
  triageSource: z.enum(["ai", "fallback"]).nullable().optional(),
  photoMediaId: uuid.nullable().optional(),
  areaId,
  lat,
  lng,
  addressNote: z.string().trim().max(200).nullable().optional(),
  offerAmount: z.number().int().min(100).max(500_000).nullable().optional(),
});

export const postMessageInput = z.object({
  kind: z.enum(["text", "voice", "offer"]),
  text: z.string().trim().max(1500).nullable().optional(),
  audioMediaId: uuid.nullable().optional(),
  offerAmount: z.number().int().min(100).max(500_000).nullable().optional(),
});

export const reviewInput = z.object({
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string().max(30)).max(8).default([]),
  paidAgreedPrice: z.boolean().nullable().optional(),
  wouldHireAgain: z.boolean().nullable().optional(),
  comment: z.string().trim().max(1000).nullable().optional(),
});

export const REVIEW_TAGS = [
  { id: "On time", ur: "وقت پر آئے" },
  { id: "Fair price", ur: "مناسب قیمت" },
  { id: "Fixed it first time", ur: "پہلی بار میں ٹھیک" },
  { id: "Clean work", ur: "صاف کام" },
  { id: "Polite", ur: "اچھا رویہ" },
  { id: "Explained the problem", ur: "مسئلہ سمجھایا" },
  { id: "Late", ur: "دیر سے آئے" },
  { id: "Overcharged", ur: "زیادہ پیسے" },
] as const;
