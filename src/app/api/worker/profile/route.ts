import { json, parseBody, requireUser, route } from "@/server/http";
import { workerProfileInput } from "@/lib/validation";
import { toWorkerPublic, upsertWorkerProfile, isWorkerEngaged } from "@/server/services/workers";

/** Create or update the signed-in user's worker profile (role becomes "worker"). */
export const PUT = route(async (req) => {
  const u = await requireUser(req);
  const input = await parseBody(req, workerProfileInput);
  const w = await upsertWorkerProfile(u.id, input);
  return json({ worker: toWorkerPublic(w, await isWorkerEngaged(w.id)) });
});
