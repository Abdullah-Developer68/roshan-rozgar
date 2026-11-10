import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { json, route } from "@/server/http";

export const GET = route(async () => {
  await db.execute(sql`select 1`);
  return json({ ok: true, ai: Boolean(process.env.OPENROUTER_API_KEY) });
});
