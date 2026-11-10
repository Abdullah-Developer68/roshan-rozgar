import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { user as userTable, workers } from "@/db/schema";
import { json, parseBody, requireUser, route } from "@/server/http";
import { customerProfileInput } from "@/lib/validation";
import { toWorkerPublic, isWorkerEngaged } from "@/server/services/workers";
import type { MeDTO } from "@/lib/types";

export const GET = route(async (req) => {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return json({ user: null, worker: null } satisfies MeDTO);
  const u = session.user as typeof session.user & { role?: string; phoneNumber?: string | null };
  const [w] = await db.select().from(workers).where(eq(workers.userId, u.id)).limit(1);
  const me: MeDTO = {
    user: {
      id: u.id,
      name: u.name,
      phone: u.phoneNumber ?? null,
      role: w ? "worker" : u.role === "worker" ? "worker" : "customer",
    },
    worker: w ? toWorkerPublic(w, await isWorkerEngaged(w.id)) : null,
  };
  return json(me);
});

/** Customer completes sign-up by giving a display name. */
export const POST = route(async (req) => {
  const u = await requireUser(req);
  const { name } = await parseBody(req, customerProfileInput);
  await db.update(userTable).set({ name }).where(eq(userTable.id, u.id));
  return json({ ok: true });
});
