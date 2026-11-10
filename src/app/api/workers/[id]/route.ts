import { z } from "zod";
import { HttpError, json, requireUser, route } from "@/server/http";
import { getWorkerPublic, getWorkerReviews, priceStats } from "@/server/services/workers";

export const GET = route(async (req, ctx: RouteContext<"/api/workers/[id]">) => {
  await requireUser(req);
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) throw new HttpError(404, "Worker not found");
  const worker = await getWorkerPublic(id);
  if (!worker) throw new HttpError(404, "Worker not found");
  const [reviews, stats] = await Promise.all([getWorkerReviews(id), priceStats(worker.trade)]);
  return json({ worker, reviews, priceStats: stats });
});
