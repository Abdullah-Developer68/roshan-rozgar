import "server-only";
import { eq } from "drizzle-orm";
import { ZodError, type z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { workers } from "@/db/schema";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wrap a route handler: maps HttpError/ZodError to JSON responses. */
export function route<C>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, code: e.code }, e.status);
      if (e instanceof ZodError)
        return json({ error: "Invalid request", issues: e.issues.slice(0, 5) }, 400);
      console.error("[api] unhandled", e);
      return json({ error: "Something went wrong" }, 500);
    }
  };
}

export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  const body = await req.json().catch(() => {
    throw new HttpError(400, "Body must be JSON");
  });
  return schema.parse(body);
}

export async function requireUser(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) throw new HttpError(401, "Please sign in", "unauthenticated");
  return session.user as typeof session.user & { role: string; phoneNumber?: string | null };
}

export async function requireWorker(req: Request) {
  const user = await requireUser(req);
  const [worker] = await db.select().from(workers).where(eq(workers.userId, user.id)).limit(1);
  if (!worker) throw new HttpError(403, "Worker profile not found", "no_worker_profile");
  return { user, worker };
}
