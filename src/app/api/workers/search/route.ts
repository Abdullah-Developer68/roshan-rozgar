import { json, parseBody, requireUser, route } from "@/server/http";
import { searchInput } from "@/lib/validation";
import { searchWorkers } from "@/server/services/workers";

export const POST = route(async (req) => {
  await requireUser(req);
  const input = await parseBody(req, searchInput);
  const workers = await searchWorkers(input);
  return json({ workers });
});
