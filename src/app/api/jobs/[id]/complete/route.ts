import { json, requireUser, route } from "@/server/http";
import { completeJob } from "@/server/services/jobs";

export const POST = route(async (req, ctx: RouteContext<"/api/jobs/[id]/complete">) => {
  const u = await requireUser(req);
  const { id } = await ctx.params;
  return json(await completeJob(id, { id: u.id, name: u.name }));
});
