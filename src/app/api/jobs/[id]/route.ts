import { z } from "zod";
import { HttpError, json, requireUser, route } from "@/server/http";
import { getJobThread } from "@/server/services/jobs";

/** Polled by both sides of the conversation. */
export const GET = route(async (req, ctx: RouteContext<"/api/jobs/[id]">) => {
  const u = await requireUser(req);
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) throw new HttpError(404, "Job not found");
  return json(await getJobThread(id, { id: u.id, name: u.name }));
});
