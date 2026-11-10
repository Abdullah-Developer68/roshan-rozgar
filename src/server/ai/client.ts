import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/server/db";
import { aiCalls } from "@/db/schema";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "input_audio"; input_audio: { data: string; format: string } };

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string | ContentPart[] };

export type AiResult<T> =
  | { ok: true; data: T; model: string; cached: boolean; latencyMs: number }
  | { ok: false; error: string; quotaExhausted: boolean };

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export const MODEL_CHAINS = {
  text: (process.env.OPENROUTER_TEXT_MODELS ??
    "nvidia/nemotron-3.5-super-vl:free,google/gemma-4-31b-it:free,openrouter/free"
  ).split(","),
  vision: (process.env.OPENROUTER_VISION_MODELS ??
    "nvidia/nemotron-3.5-super-vl:free,google/gemma-4-31b-it:free"
  ).split(","),
  audio: (process.env.OPENROUTER_AUDIO_MODELS ??
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
  ).split(","),
} as const;

// When the daily free-model quota is hit we stop calling OpenRouter for a while so
// requests fall back instantly instead of waiting on guaranteed 429s.
const g = globalThis as unknown as { aiQuotaBlockedUntil?: number };

function hashInput(task: string, messages: ChatMessage[]): string {
  return createHash("sha256").update(task).update(JSON.stringify(messages)).digest("hex");
}

/** Pull the first JSON object out of a model reply (tolerates ```json fences and chatter). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in model reply");
  return JSON.parse(body.slice(start, end + 1));
}

async function logCall(row: typeof aiCalls.$inferInsert) {
  try {
    await db.insert(aiCalls).values(row);
  } catch (e) {
    console.error("[ai] failed to log call", e);
  }
}

/**
 * Call OpenRouter and parse a JSON reply against `schema`.
 * - Identical inputs are served from the ai_calls cache (saves the free daily quota).
 * - Tries each model in the chain on 429/5xx/invalid JSON.
 * - Never throws: callers decide on a deterministic fallback when ok=false.
 */
export async function aiJson<S extends z.ZodType>(opts: {
  task: string;
  chain: keyof typeof MODEL_CHAINS;
  messages: ChatMessage[];
  schema: S;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<AiResult<z.infer<S>>> {
  const { task, chain, messages, schema } = opts;
  const inputHash = hashInput(task, messages);

  // 1) Cache
  try {
    const [hit] = await db
      .select({ output: aiCalls.output, model: aiCalls.model })
      .from(aiCalls)
      .where(and(eq(aiCalls.task, task), eq(aiCalls.inputHash, inputHash), eq(aiCalls.status, "ok")))
      .orderBy(desc(aiCalls.createdAt))
      .limit(1);
    if (hit) {
      const parsed = schema.safeParse(hit.output);
      if (parsed.success) {
        void logCall({ task, inputHash, model: hit.model, status: "cache_hit", latencyMs: 0 });
        return { ok: true, data: parsed.data, model: hit.model ?? "cache", cached: true, latencyMs: 0 };
      }
    }
  } catch (e) {
    console.error("[ai] cache lookup failed", e);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { ok: false, error: "OPENROUTER_API_KEY not configured", quotaExhausted: false };
  if ((g.aiQuotaBlockedUntil ?? 0) > Date.now()) {
    return { ok: false, error: "Daily free AI quota reached", quotaExhausted: true };
  }

  let lastError = "unknown error";
  for (const model of MODEL_CHAINS[chain]) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "Roshan Rozgar",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: opts.maxTokens ?? 900,
          response_format: { type: "json_object" },
          reasoning: { enabled: false },
        }),
      });
      const latencyMs = Date.now() - started;
      const payload = (await res.json().catch(() => null)) as {
        choices?: { message?: { content?: string | null } }[];
        error?: { message?: string; code?: number; metadata?: { raw?: string } };
      } | null;

      if (!res.ok || payload?.error) {
        const msg = payload?.error?.metadata?.raw ?? payload?.error?.message ?? `HTTP ${res.status}`;
        lastError = `${model}: ${msg}`;
        void logCall({ task, inputHash, model, status: "error", latencyMs, error: lastError.slice(0, 500) });
        if (res.status === 429 && /per-day|free-models-per-day|daily/i.test(msg)) {
          g.aiQuotaBlockedUntil = Date.now() + 10 * 60_000;
          return { ok: false, error: "Daily free AI quota reached", quotaExhausted: true };
        }
        if (res.status === 401 || res.status === 402) break;
        continue; // upstream rate-limit / provider error: try next model
      }

      const content = payload?.choices?.[0]?.message?.content ?? "";
      const parsed = schema.safeParse(extractJson(content));
      if (!parsed.success) {
        lastError = `${model}: schema mismatch ${parsed.error.issues[0]?.message ?? ""}`;
        void logCall({ task, inputHash, model, status: "error", latencyMs, error: lastError.slice(0, 500) });
        continue;
      }
      await logCall({ task, inputHash, model, status: "ok", latencyMs, output: parsed.data as object });
      return { ok: true, data: parsed.data, model, cached: false, latencyMs };
    } catch (e) {
      lastError = `${model}: ${e instanceof Error ? e.message : String(e)}`;
      void logCall({
        task,
        inputHash,
        model,
        status: "error",
        latencyMs: Date.now() - started,
        error: lastError.slice(0, 500),
      });
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, error: lastError, quotaExhausted: false };
}
