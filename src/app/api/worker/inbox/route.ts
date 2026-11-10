import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { workers } from "@/db/schema";
import { json, requireWorker, route } from "@/server/http";
import { isWorkerEngaged, toWorkerPublic } from "@/server/services/workers";
import { workerInbox } from "@/server/services/jobs";

/** Polled by the worker dashboard: incoming requests + active booking. Also a heartbeat. */
export const GET = route(async (req) => {
  const { worker } = await requireWorker(req);
  await db.update(workers).set({ lastActiveAt: new Date() }).where(eq(workers.id, worker.id));
  const inbox = await workerInbox(worker.id);
  return json({ worker: toWorkerPublic(worker, await isWorkerEngaged(worker.id)), ...inbox });
});
