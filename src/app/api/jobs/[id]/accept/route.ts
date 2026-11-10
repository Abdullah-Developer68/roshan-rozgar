import { z } from "zod";
import { json, parseBody, requireUser, route } from "@/server/http";
import { acceptOffer } from "@/server/services/jobs";

/** Accept the other side's pending price offer -> job is booked (atomic). */
export const POST = route(async (req, ctx: RouteContext<"/api/jobs/[id]/accept">) => {
  const u = await requireUser(req);
  const { id } = await ctx.params;
  const { messageId } = await parseBody(req, z.object({ messageId: z.uuid() }));
  return json(await acceptOffer(id, { id: u.id, name: u.name }, messageId));
});
