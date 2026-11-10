import { json, parseBody, requireUser, route } from "@/server/http";
import { reviewInput } from "@/lib/validation";
import { submitReview } from "@/server/services/jobs";

export const POST = route(async (req, ctx: RouteContext<"/api/jobs/[id]/review">) => {
  const u = await requireUser(req);
  const { id } = await ctx.params;
  const input = await parseBody(req, reviewInput);
  return json(await submitReview(id, { id: u.id, name: u.name }, input), 201);
});
