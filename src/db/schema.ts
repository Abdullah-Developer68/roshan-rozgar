import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ------------------------------------------------------------------ */
/* Better Auth tables                                                  */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phoneNumber: text("phone_number").unique(),
  phoneNumberVerified: boolean("phone_number_verified").notNull().default(false),
  /** "worker" | "customer" — set by our onboarding API, never by the client directly. */
  role: text("role").notNull().default("customer"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* ------------------------------------------------------------------ */
/* Media (voice notes, photos) — stored in Postgres, served by our API */
/* ------------------------------------------------------------------ */

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "set null" }),
  kind: text("kind").notNull(), // "audio" | "image"
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Workers                                                             */
/* ------------------------------------------------------------------ */

export const workers = pgTable(
  "workers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nameUr: text("name_ur"),
    trade: text("trade").notNull(),
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    experienceYears: integer("experience_years").notNull().default(0),
    areaId: text("area_id").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    visitCharge: integer("visit_charge").notNull().default(500),
    bioUr: text("bio_ur"),
    bioEn: text("bio_en"),
    languages: jsonb("languages").$type<string[]>().notNull().default(["ur"]),
    photoMediaId: uuid("photo_media_id").references(() => media.id, { onDelete: "set null" }),
    voiceIntroMediaId: uuid("voice_intro_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    onboardingTranscript: text("onboarding_transcript"),
    /** Worker's own "I'm ready for work" switch. Engagement is derived from jobs. */
    isOnline: boolean("is_online").notNull().default(false),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
    // Denormalised trust stats, recomputed whenever a review is written.
    ratingAvg: doublePrecision("rating_avg").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    jobsCompleted: integer("jobs_completed").notNull().default(0),
    trustSummaryEn: text("trust_summary_en"),
    trustSummaryUr: text("trust_summary_ur"),
    trustTags: jsonb("trust_tags").$type<string[]>().notNull().default([]),
    trustSummarySource: text("trust_summary_source"), // "ai" | "fallback" | "seed"
    isSeeded: boolean("is_seeded").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("workers_trade_idx").on(t.trade), index("workers_online_idx").on(t.isOnline)],
);

/* ------------------------------------------------------------------ */
/* Jobs: one row per (customer, worker) request. Lifecycle:            */
/*   requested -> booked -> completed                                  */
/*   requested -> declined | cancelled | expired                       */
/* ------------------------------------------------------------------ */

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Requests sent to several workers for the same problem share a group. */
    groupId: uuid("group_id").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    trade: text("trade").notNull(),
    problemText: text("problem_text").notNull(),
    summaryEn: text("summary_en"),
    summaryUr: text("summary_ur"),
    triageSource: text("triage_source"), // "ai" | "fallback"
    photoMediaId: uuid("photo_media_id").references(() => media.id, { onDelete: "set null" }),
    areaId: text("area_id").notNull(),
    addressNote: text("address_note"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    distanceKm: doublePrecision("distance_km"),
    status: text("status").notNull().default("requested"),
    closeReason: text("close_reason"),
    agreedPrice: integer("agreed_price"),
    bookedAt: timestamp("booked_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    isSeeded: boolean("is_seeded").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("jobs_worker_status_idx").on(t.workerId, t.status),
    index("jobs_customer_idx").on(t.customerId),
    index("jobs_group_idx").on(t.groupId),
    // Hard guarantee: a worker can be engaged on at most one booked job at a time.
    uniqueIndex("jobs_one_active_booking_per_worker")
      .on(t.workerId)
      .where(sql`status = 'booked'`),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    senderUserId: text("sender_user_id").references(() => user.id, { onDelete: "set null" }),
    senderRole: text("sender_role").notNull(), // "customer" | "worker" | "system"
    kind: text("kind").notNull(), // "text" | "voice" | "offer" | "system"
    text: text("text"),
    audioMediaId: uuid("audio_media_id").references(() => media.id, { onDelete: "set null" }),
    textEn: text("text_en"),
    textUr: text("text_ur"),
    aiSource: text("ai_source"), // "ai" | "fallback" | null
    offerAmount: integer("offer_amount"),
    offerStatus: text("offer_status"), // "pending" | "accepted" | "superseded"
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_job_idx").on(t.jobId, t.createdAt)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .unique()
      .references(() => jobs.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    customerName: text("customer_name").notNull(),
    rating: integer("rating").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    paidAgreedPrice: boolean("paid_agreed_price"),
    wouldHireAgain: boolean("would_hire_again"),
    comment: text("comment"),
    agreedPrice: integer("agreed_price"),
    isSeeded: boolean("is_seeded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reviews_worker_idx").on(t.workerId)],
);

/* ------------------------------------------------------------------ */
/* Infra: AI call log + cache, simulated SMS gateway                   */
/* ------------------------------------------------------------------ */

export const aiCalls = pgTable(
  "ai_calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    task: text("task").notNull(),
    inputHash: text("input_hash").notNull(),
    model: text("model"),
    status: text("status").notNull(), // "ok" | "error" | "cache_hit"
    latencyMs: integer("latency_ms"),
    output: jsonb("output"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_calls_lookup_idx").on(t.task, t.inputHash, t.status)],
);

export const smsOutbox = pgTable(
  "sms_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phoneNumber: text("phone_number").notNull(),
    body: text("body").notNull(),
    code: text("code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sms_outbox_phone_idx").on(t.phoneNumber, t.createdAt)],
);

export type Worker = typeof workers.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
