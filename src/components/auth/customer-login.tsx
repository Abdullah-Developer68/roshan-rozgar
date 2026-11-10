"use client";
import { ArrowRight, Phone } from "lucide-react";
import { useEffect } from "react";
import { useLoginStore } from "@/stores/login-store";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <div className="mx-auto w-full max-w-sm py-10">
      <Card className="gap-5">
        <CardHeader>
          <CardTitle className="text-2xl font-medium tracking-tight">{t("clTitle")}</CardTitle>
          <CardDescription>{t("clSub")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {step === "phone" ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
            >
              <div className="relative">
                <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="03001234567"
                  value={digits}
                  onChange={(e) => setDigits(e.target.value)}
                  className="h-11 ps-9 text-base"
                  dir="ltr"
                  aria-label={t("mobileNumber")}
                />
              </div>
              <Button size="xl" disabled={busy}>
                {busy ? <Spinner /> : <>{t("sendCode")} <ArrowRight className="rtl:rotate-180" /></>}
              </Button>
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
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 text-center text-2xl font-semibold tracking-[0.4em]"
                dir="ltr"
                aria-label="6-digit code"
              />
              <Button size="xl" disabled={busy || code.length !== 6}>
                {busy ? <Spinner /> : t("verify")}
              </Button>
              <Button type="button" variant="link" onClick={reset} className="text-muted-foreground">
                {t("otherNumber")}
              </Button>
            </form>
          )}
          {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Separator className="my-1" />
          <p className="eyebrow">{t("judgesDemo")}</p>
          <Button variant="outline" className="h-auto justify-start whitespace-normal py-2.5 text-start" onClick={() => void demoSignIn("+923001111111")} disabled={busy}>
            {t("demoCustomerBtn")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
