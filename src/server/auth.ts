import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { db } from "@/server/db";
import * as schema from "@/db/schema";
import { isValidPkPhone } from "@/lib/phone";

function trustedOrigins(): string[] {
  const list = ["http://localhost:3000"];
  if (process.env.BETTER_AUTH_URL) list.push(process.env.BETTER_AUTH_URL);
  if (process.env.NEXT_PUBLIC_APP_URL) list.push(process.env.NEXT_PUBLIC_APP_URL);
  if (process.env.VERCEL_URL) list.push(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    list.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return list;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  trustedOrigins: trustedOrigins(),
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "customer", input: false },
    },
  },
  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      phoneNumberValidator: (p) => isValidPkPhone(p),
      // SIMULATED SMS GATEWAY: no real SMS is sent. The code is written to the
      // sms_outbox table and shown in the app's on-screen "SMS" banner.
      sendOTP: async ({ phoneNumber: phone, code }) => {
        await db.insert(schema.smsOutbox).values({
          phoneNumber: phone,
          code,
          body: `Roshan Rozgar code: ${code}. روشن روزگار کوڈ: ${code}`,
        });
      },
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace(/\D/g, "")}@phone.roshanrozgar.app`,
        getTempName: () => "New user",
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
