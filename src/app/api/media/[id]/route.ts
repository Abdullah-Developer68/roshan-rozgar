import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { media } from "@/db/schema";
import { HttpError, route } from "@/server/http";

export const GET = route(async (req, ctx: RouteContext<"/api/media/[id]">) => {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) throw new HttpError(404, "Not found");
  const [m] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!m) throw new HttpError(404, "Not found");
  return new Response(new Uint8Array(m.data), {
    headers: {
      "Content-Type": m.mime,
      "Content-Length": String(m.sizeBytes),
      // Media rows are immutable; ids are unguessable UUIDs.
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
});
