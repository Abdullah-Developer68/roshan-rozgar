import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { media } from "@/db/schema";
import { HttpError, json, parseBody, requireUser, route } from "@/server/http";
import { triageInput } from "@/lib/validation";
import { triageProblem } from "@/server/ai/tasks";
import { priceStats } from "@/server/services/workers";

/** Customer's problem (text/voice transcript and/or photo) -> trade, Urdu summary, price band. */
export const POST = route(async (req) => {
  const u = await requireUser(req);
  const { text, photoMediaId } = await parseBody(req, triageInput);
  let imageDataUrl: string | null = null;
  if (photoMediaId) {
    const [m] = await db.select().from(media).where(eq(media.id, photoMediaId)).limit(1);
    if (!m || m.ownerUserId !== u.id || m.kind !== "image") throw new HttpError(404, "Photo not found");
    imageDataUrl = `data:${m.mime};base64,${m.data.toString("base64")}`;
  }
  if (!text && !imageDataUrl) throw new HttpError(400, "Describe the problem or add a photo");
  const result = await triageProblem({ text, imageDataUrl });
  const stats = result.data.trade ? await priceStats(result.data.trade) : null;
  return json({ ...result, priceStats: stats });
});
