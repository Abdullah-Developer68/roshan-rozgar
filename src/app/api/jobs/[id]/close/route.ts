import { z } from "zod";
import { json, parseBody, requireUser, route } from "@/server/http";
import { closeJob } from "@/server/services/jobs";

export const POST = route(async (req, ctx: RouteContext<"/api/jobs/[id]/close">) => {
  const u = await requireUser(req);
  const { id } = await ctx.params;
  const { action } = await parseBody(req, z.object({ action: z.enum(["decline", "cancel"]) }));
  return json(await closeJob(id, { id: u.id, name: u.name }, action));
});
