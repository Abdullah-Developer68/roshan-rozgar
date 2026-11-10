import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/server/db";
import { smsOutbox } from "@/db/schema";
import { HttpError, json, route } from "@/server/http";
import { normalizePkPhone } from "@/lib/phone";

/**
 * SIMULATED SMS INBOX (demo only). There is no SMS gateway in this hackathon build,
 * so the OTP "sent" to a phone is readable here and shown in an on-screen SMS banner.
 * Disable with DEMO_SMS_INBOX=false once a real SMS provider is wired into sendOTP.
 */
export const GET = route(async (req) => {
  if (process.env.DEMO_SMS_INBOX === "false") throw new HttpError(404, "Not found");
  const phone = normalizePkPhone(new URL(req.url).searchParams.get("phone") ?? "");
  if (!phone) throw new HttpError(400, "Invalid phone");
  const [sms] = await db
    .select({ body: smsOutbox.body, code: smsOutbox.code, createdAt: smsOutbox.createdAt })
    .from(smsOutbox)
    .where(and(eq(smsOutbox.phoneNumber, phone), gt(smsOutbox.createdAt, new Date(Date.now() - 5 * 60_000))))
    .orderBy(desc(smsOutbox.createdAt))
    .limit(1);
  return json({ sms: sms ?? null });
});
