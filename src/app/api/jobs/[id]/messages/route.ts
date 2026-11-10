import { json, parseBody, requireUser, route } from "@/server/http";
import { postMessageInput } from "@/lib/validation";
import { postMessage } from "@/server/services/jobs";

export const POST = route(async (req, ctx: RouteContext<"/api/jobs/[id]/messages">) => {
  const u = await requireUser(req);
  const { id } = await ctx.params;
  const input = await parseBody(req, postMessageInput);
  return json(await postMessage(id, { id: u.id, name: u.name }, input), 201);
});
