import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

// Reuse one client across hot reloads / warm serverless invocations.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

// Supabase transaction-mode pooler: prepared statements are not supported.
const client =
  globalForDb.pgClient ??
  postgres(connectionString, { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 15 });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export type DB = typeof db;
