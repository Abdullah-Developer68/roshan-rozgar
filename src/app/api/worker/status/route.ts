import { z } from "zod";
import { json, parseBody, requireWorker, route } from "@/server/http";
import { isWorkerEngaged, setWorkerOnline, toWorkerPublic } from "@/server/services/workers";

/** Worker's "ready for work" switch. */
export const POST = route(async (req) => {
  const { worker } = await requireWorker(req);
  const { isOnline } = await parseBody(req, z.object({ isOnline: z.boolean() }));
  const w = await setWorkerOnline(worker.id, isOnline);
  return json({ worker: toWorkerPublic(w, await isWorkerEngaged(w.id)) });
});
