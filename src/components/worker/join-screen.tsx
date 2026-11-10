"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSessionStore } from "@/stores/session-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { WorkerPhoneLogin } from "@/components/auth/worker-phone-login";
import { SpeakStep } from "@/components/worker/speak-step";
import { ReviewStep } from "@/components/worker/review-step";
import { PhotoStep } from "@/components/worker/photo-step";
import { WorkerShell } from "@/components/worker/worker-shell";
import { Spinner } from "@/components/ui/spinner";

const STEPS = [
  { key: "phone", icon: "📱" },
  { key: "speak", icon: "🎤" },
  { key: "review", icon: "✅" },
  { key: "photo", icon: "📷" },
] as const;

function Progress() {
  const me = useSessionStore((s) => s.me);
  const step = useOnboardingStore((s) => s.step);
  const current = !me?.user ? "phone" : step;
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex items-center justify-center gap-2" aria-label="Progress" dir="ltr">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={`flex size-10 items-center justify-center rounded-full text-lg ${
              i < idx ? "bg-ok/15" : i === idx ? "bg-brand text-white ring-4 ring-brand/20" : "bg-zinc-100 opacity-50"
            }`}
          >
            {i < idx ? "✔️" : s.icon}
          </span>
          {i < STEPS.length - 1 && <span className={`h-1 w-5 rounded ${i < idx ? "bg-ok" : "bg-zinc-200"}`} />}
        </li>
      ))}
    </ol>
  );
}

export function WorkerJoinScreen() {
  const router = useRouter();
  const me = useSessionStore((s) => s.me);
  const status = useSessionStore((s) => s.status);
  const load = useSessionStore((s) => s.load);
  const step = useOnboardingStore((s) => s.step);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (me?.worker) router.replace("/worker");
  }, [me?.worker, router]);

  return (
    <WorkerShell>
      <Progress />
      {status !== "ready" || me?.worker ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-10 text-brand" />
        </div>
      ) : !me?.user ? (
        <WorkerPhoneLogin />
      ) : step === "speak" ? (
        <SpeakStep />
      ) : step === "review" ? (
        <ReviewStep />
      ) : (
        <PhotoStep />
      )}
    </WorkerShell>
  );
}
