"use client";
import { ArrowRight, Phone } from "lucide-react";
import { useEffect } from "react";
import { useLoginStore } from "@/stores/login-store";
import { Spinner } from "@/components/ui/spinner";
import { SimulatedSms } from "@/components/auth/simulated-sms";
import { useT } from "@/lib/i18n";

export function CustomerLogin() {
  const digits = useLoginStore((s) => s.digits);
  const step = useLoginStore((s) => s.step);
  const code = useLoginStore((s) => s.code);
  const busy = useLoginStore((s) => s.busy);
  const error = useLoginStore((s) => s.error);
  const setDigits = useLoginStore((s) => s.setDigits);
  const setCode = useLoginStore((s) => s.setCode);
  const sendCode = useLoginStore((s) => s.sendCode);
  const verify = useLoginStore((s) => s.verify);
  const reset = useLoginStore((s) => s.reset);
  const demoSignIn = useLoginStore((s) => s.demoSignIn);
  const { t } = useT();

  useEffect(() => reset, [reset]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{t("clTitle")}</h1>
        <p className="text-sm text-muted">{t("clSub")}</p>
      </div>
      {step === "phone" ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode();
          }}
        >
          <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
            <Phone className="size-5 text-muted" />
            <input
              inputMode="numeric"
              autoComplete="tel"
              placeholder="03001234567"
              value={digits}
              onChange={(e) => setDigits(e.target.value)}
              className="w-full bg-transparent text-lg outline-none"
              dir="ltr"
              aria-label={t("mobileNumber")}
            />
          </label>
          <button disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand font-semibold text-white disabled:opacity-60">
            {busy ? <Spinner /> : <>{t("sendCode")} <ArrowRight className="size-4 rtl:rotate-180" /></>}
          </button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <SimulatedSms />
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-2xl bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
            dir="ltr"
            aria-label="6-digit code"
          />
          <button disabled={busy || code.length !== 6} className="flex h-12 items-center justify-center rounded-2xl bg-brand font-semibold text-white disabled:opacity-60">
            {busy ? <Spinner /> : t("verify")}
          </button>
          <button type="button" onClick={reset} className="text-sm text-muted underline">
            {t("otherNumber")}
          </button>
        </form>
      )}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-2 rounded-2xl border border-dashed border-line p-3 text-sm">
        <p className="mb-2 font-semibold">{t("judgesDemo")}</p>
        <button
          onClick={() => void demoSignIn("+923001111111")}
          disabled={busy}
          className="w-full rounded-xl bg-sun-soft px-3 py-2 text-start font-medium text-amber-900 ring-1 ring-amber-200"
        >
          {t("demoCustomerBtn")}
        </button>
      </div>
    </div>
  );
}
