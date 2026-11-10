"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLoginStore } from "@/stores/login-store";
import { useSessionStore } from "@/stores/session-store";
import { Spinner } from "@/components/ui/spinner";
import { useT, type MsgKey } from "@/lib/i18n";

const ACCOUNTS: { phone: string; label: MsgKey; to: string }[] = [
  { phone: "+923001111111", label: "demoAyesha", to: "/customer" },
  { phone: "+923002222222", label: "demoAslam", to: "/worker" },
];

/** One-tap demo sign-in: runs the real OTP flow against the simulated SMS inbox. */
export function DemoPanel() {
  const demoSignIn = useLoginStore((s) => s.demoSignIn);
  const signOut = useSessionStore((s) => s.signOut);
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const { t } = useT();
  return (
    <div className="flex flex-col gap-2">
      {ACCOUNTS.map((a) => (
        <button
          key={a.phone}
          disabled={!!busy}
          onClick={async () => {
            setBusy(a.phone);
            await signOut();
            const ok = await demoSignIn(a.phone);
            setBusy(null);
            if (ok) router.push(a.to);
          }}
          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-start text-[13px] font-medium transition hover:border-foreground/40"
        >
          <span>{t(a.label)}</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground" dir="ltr">
            {busy === a.phone ? <Spinner className="size-4" /> : `0${a.phone.slice(3, 6)} ${a.phone.slice(6)}`}
          </span>
        </button>
      ))}
    </div>
  );
}
