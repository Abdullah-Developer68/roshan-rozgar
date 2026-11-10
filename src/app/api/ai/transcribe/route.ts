import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { media } from "@/db/schema";
import { HttpError, json, parseBody, requireUser, route } from "@/server/http";
import { transcribeAudio } from "@/server/ai/tasks";

/** Server-side speech-to-text for browsers without the Web Speech API. */
export const POST = route(async (req) => {
  const u = await requireUser(req);
  const { mediaId } = await parseBody(req, z.object({ mediaId: z.uuid() }));
  const [m] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
  if (!m || m.ownerUserId !== u.id || m.kind !== "audio") throw new HttpError(404, "Audio not found");
  const res = await transcribeAudio({ data: m.data, mediaType: m.mime });
  if (!res.ok) throw new HttpError(503, res.quotaExhausted ? "AI quota reached for today" : "Could not transcribe", "ai_unavailable");
  return json({ transcript: res.data.transcript, language: res.data.language });
});
