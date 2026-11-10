"use client";
import { MessageCircle } from "lucide-react";
import { useLoginStore } from "@/stores/login-store";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/lib/i18n";

/** Stands in for the phone's SMS notification. There is no SMS gateway in this demo build. */
export function SimulatedSms() {
  const sms = useLoginStore((s) => s.sms);
  const busy = useLoginStore((s) => s.busy);
  const { t, isUr, dir } = useT();
  const [enPart, urPart] = sms ? sms.body.split("روشن") : ["", ""];
  return (
    <div className="rounded-2xl bg-zinc-900 p-3 text-white shadow-lg" dir={dir}>
      <div className="mb-1 flex items-center justify-between text-[11px] tracking-wide text-white/60">
        <span className="flex items-center gap-1">
          <MessageCircle className="size-3.5" /> {t("smsHeader")}
        </span>
        <span>{t("now")}</span>
      </div>
      {sms ? (
        isUr ? (
          <p className="urdu text-base" lang="ur">روشن{urPart}</p>
        ) : (
          <p className="text-sm" dir="ltr">{enPart}</p>
        )
      ) : busy ? (
        <span className="flex items-center gap-2 text-sm text-white/70">
          <Spinner className="size-4" /> {t("smsWaiting")}
        </span>
      ) : (
        <span className="text-sm text-white/70">{t("smsNone")}</span>
      )}
    </div>
  );
}
