"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLoginStore } from "@/stores/login-store";
import { useSessionStore } from "@/stores/session-store";
import { Spinner } from "@/components/ui/spinner";

const ACCOUNTS = [
  { phone: "+923001111111", label: "Ayesha · customer in G-9", to: "/customer" },
  { phone: "+923002222222", label: "Muhammad Aslam · electrician in G-9", to: "/worker" },
];

/** One-tap demo sign-in: runs the real OTP flow against the simulated SMS inbox. */
export function DemoPanel() {
  const demoSignIn = useLoginStore((s) => s.demoSignIn);
  const signOut = useSessionStore((s) => s.signOut);
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
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
          className="flex items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 text-left text-sm font-medium ring-1 ring-line hover:ring-brand"
        >
          <span>{a.label}</span>
          <span className="flex items-center gap-2 text-xs text-muted">
            {busy === a.phone ? <Spinner className="size-4" /> : `0${a.phone.slice(3, 6)} ${a.phone.slice(6)}`}
          </span>
        </button>
      ))}
    </div>
  );
}
