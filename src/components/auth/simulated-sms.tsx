"use client";
import { MessageCircle } from "lucide-react";
import { useLoginStore } from "@/stores/login-store";
import { Spinner } from "@/components/ui/spinner";

/** Stands in for the phone's SMS notification. There is no SMS gateway in this demo build. */
export function SimulatedSms() {
  const sms = useLoginStore((s) => s.sms);
  const busy = useLoginStore((s) => s.busy);
  return (
    <div className="rounded-2xl bg-zinc-900 p-3 text-white shadow-lg" dir="ltr">
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
        <span className="flex items-center gap-1">
          <MessageCircle className="size-3.5" /> Messages · simulated SMS
        </span>
        <span>now</span>
      </div>
      {sms ? (
        <p className="text-sm">
          {sms.body.split("روشن")[0]}
          <span className="urdu block text-right text-base" dir="rtl" lang="ur">
            روشن{sms.body.split("روشن")[1]}
          </span>
        </p>
      ) : busy ? (
        <span className="flex items-center gap-2 text-sm text-white/70">
          <Spinner className="size-4" /> Waiting for SMS…
        </span>
      ) : (
        <span className="text-sm text-white/70">No SMS yet</span>
      )}
    </div>
  );
}
