import "server-only";
import { createHash } from "node:crypto";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { APICallError, NoObjectGeneratedError, Output, generateText, type UserContent } from "ai";
import { and, desc, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/server/db";
import { aiCalls } from "@/db/schema";

/**
 * All AI goes through the Vercel AI SDK (`generateText` + `Output.object`) with the
 * OpenRouter provider. On top of the SDK this module adds what a 50-requests/day free
 * key needs: an input-hash cache (ai_calls table), a model fallback chain, a quota
 * circuit-breaker, salvage of near-miss JSON, and a never-throw result type so every
 * caller can fall back to its deterministic parser.
 */

export type AiPart =
  | { type: "text"; text: string }
  | { type: "image"; data: Buffer; mediaType: string }
  | { type: "audio"; data: Buffer; mediaType: string };

export type AiResult<T> =
  | { ok: true; data: T; model: string; cached: boolean; latencyMs: number }
  | { ok: false; error: string; quotaExhausted: boolean };

export const MODEL_CHAINS = {
  text: (process.env.OPENROUTER_TEXT_MODELS ??
    "nvidia/nemotron-3.5-super-vl:free,google/gemma-4-31b-it:free,openrouter/free"
  ).split(","),
  vision: (process.env.OPENROUTER_VISION_MODELS ??
    "nvidia/nemotron-3.5-super-vl:free,google/gemma-4-31b-it:free"
  ).split(","),
  audio: (process.env.OPENROUTER_AUDIO_MODELS ?? "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free").split(","),
} as const;

/** Audio containers OpenRouter accepts (WebM is not one of them). */
const AUDIO_OK = /^audio\/(mpeg|mp3|wav|x-wav|wave|ogg|vorbis|aac|x-aac|m4a|x-m4a|mp4|flac|x-flac|aiff|x-aiff)$/;
export const isSupportedAudio = (mime: string) => AUDIO_OK.test(mime.split(";")[0]);

let provider: ReturnType<typeof createOpenRouter> | null = null;
function openrouter() {
  if (!provider) {
    provider = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      appName: "Roshan Rozgar",
      appUrl: process.env.BETTER_AUTH_URL,
      compatibility: "strict",
      // Free reasoning models think for seconds before answering; our tasks are extraction, not reasoning.
      extraBody: { reasoning: { enabled: false } },
    });
  }
  return provider;
}

const model = (id: string) => openrouter().chat(id, { structuredOutputs: { strict: false } });

// Daily free-model quota reached: stop calling for a while so requests fall back instantly.
const g = globalThis as unknown as { aiQuotaBlockedUntil?: number };

function hashInput(task: string, system: string, content: AiPart[]): string {
  const h = createHash("sha256").update(task).update(system);
  for (const p of content) {
    if (p.type === "text") h.update(`t:${p.text}`);
    else h.update(`${p.type}:${p.mediaType}:`).update(p.data);
  }
  return h.digest("hex");
}

function toSdkContent(content: AiPart[]): UserContent {
  return content.map((p) =>
    p.type === "text"
      ? { type: "text" as const, text: p.text }
      : p.type === "image"
        ? { type: "image" as const, image: p.data, mediaType: p.mediaType }
        : { type: "file" as const, data: p.data, mediaType: p.mediaType },
  );
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

const isQuotaError = (e: APICallError) =>
  e.statusCode === 429 && /per-day|free-models-per-day|daily/i.test(`${e.message} ${e.responseBody ?? ""}`);
const isUnsupportedFormat = (e: APICallError) =>
  (e.statusCode === 400 || e.statusCode === 404) &&
  /response_format|json_schema|structured|no endpoints/i.test(`${e.message} ${e.responseBody ?? ""}`);

/**
 * Generate a structured object with the AI SDK.
 * `wire` constrains the model; `schema` normalises the result (and salvages near-misses).
 */
export async function aiObject<W extends z.ZodType, S extends z.ZodType>(opts: {
  task: string;
  chain: keyof typeof MODEL_CHAINS;
  system: string;
  content: string | AiPart[];
  wire: W;
  schema: S;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<AiResult<z.infer<S>>> {
  const { task, chain, system, wire, schema } = opts;
  const content: AiPart[] = typeof opts.content === "string" ? [{ type: "text", text: opts.content }] : opts.content;
  const inputHash = hashInput(task, system, content);

  // 1) Cache: identical inputs never spend quota twice.
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

  if (!process.env.OPENROUTER_API_KEY) return { ok: false, error: "OPENROUTER_API_KEY not configured", quotaExhausted: false };
  if ((g.aiQuotaBlockedUntil ?? 0) > Date.now()) return { ok: false, error: "Daily free AI quota reached", quotaExhausted: true };

  const messages = [{ role: "user" as const, content: toSdkContent(content) }];
  let lastError = "unknown error";

  for (const modelId of MODEL_CHAINS[chain]) {
    // Prefer schema-constrained output; if the provider can't do json_schema, retry once in plain JSON mode.
    for (const mode of ["object", "json"] as const) {
      const started = Date.now();
      const done = async (raw: unknown, how: string) => {
        const parsed = schema.safeParse(raw);
        if (!parsed.success) return null;
        const latencyMs = Date.now() - started;
        await logCall({ task, inputHash, model: `${modelId} (${how})`, status: "ok", latencyMs, output: parsed.data as object });
        return { ok: true as const, data: parsed.data as z.infer<S>, model: modelId, cached: false, latencyMs };
      };
      try {
        const result = await generateText({
          model: model(modelId),
          system,
          messages,
          output: mode === "object" ? Output.object({ schema: wire }) : Output.json(),
          temperature: 0.2,
          maxOutputTokens: opts.maxTokens ?? 900,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
        });
        const ok = await done(result.output, mode);
        if (ok) return ok;
        lastError = `${modelId}: output failed normalisation`;
        break;
      } catch (e) {
        const latencyMs = Date.now() - started;
        // Model answered but not exactly in schema: salvage the raw text with the lenient schema.
        if (NoObjectGeneratedError.isInstance(e) && e.text) {
          try {
            const ok = await done(extractJson(e.text), `${mode}+salvaged`);
            if (ok) return ok;
          } catch {
            /* fall through */
          }
          lastError = `${modelId}: ${e.message}`;
          void logCall({ task, inputHash, model: modelId, status: "error", latencyMs, error: lastError.slice(0, 500) });
          break;
        }
        if (APICallError.isInstance(e)) {
          lastError = `${modelId}: HTTP ${e.statusCode ?? "?"} ${e.message}`;
          void logCall({ task, inputHash, model: modelId, status: "error", latencyMs, error: lastError.slice(0, 500) });
          if (isQuotaError(e)) {
            g.aiQuotaBlockedUntil = Date.now() + 10 * 60_000;
            return { ok: false, error: "Daily free AI quota reached", quotaExhausted: true };
          }
          if (e.statusCode === 401 || e.statusCode === 402) return { ok: false, error: lastError, quotaExhausted: false };
          if (mode === "object" && isUnsupportedFormat(e)) continue; // retry this model in JSON mode
          break; // upstream rate limit / provider error: next model
        }
        lastError = `${modelId}: ${e instanceof Error ? e.message : String(e)}`;
        void logCall({ task, inputHash, model: modelId, status: "error", latencyMs, error: lastError.slice(0, 500) });
        break;
      }
    }
  }
  return { ok: false, error: lastError, quotaExhausted: false };
}
