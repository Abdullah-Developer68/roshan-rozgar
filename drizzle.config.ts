import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Session-mode pooler (5432) for DDL; the app uses the transaction pooler (6543).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  strict: true,
});
