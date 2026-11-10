"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ease } from "@/components/ui/motion";
import { useSessionStore } from "@/stores/session-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { WorkerPhoneLogin } from "@/components/auth/worker-phone-login";
import { SpeakStep } from "@/components/worker/speak-step";
import { ReviewStep } from "@/components/worker/review-step";
import { PhotoStep } from "@/components/worker/photo-step";
import { WorkerShell } from "@/components/worker/worker-shell";
import { Spinner } from "@/components/ui/spinner";
import { Camera, Check, ListChecks, Mic, Smartphone } from "lucide-react";

const STEPS = [
  { key: "phone", icon: Smartphone },
  { key: "speak", icon: Mic },
  { key: "review", icon: ListChecks },
  { key: "photo", icon: Camera },
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
          <motion.span
            animate={{ scale: i === idx ? 1.08 : 1 }}
            transition={{ duration: 0.3, ease }}
            className={`flex size-10 items-center justify-center rounded-full text-lg ${
              i < idx ? "bg-ok/15" : i === idx ? "bg-brand text-white ring-4 ring-brand/20" : "bg-zinc-100 opacity-50"
            }`}
          >
            {i < idx ? <Check className="size-5 text-ok" strokeWidth={2.5} /> : <s.icon className="size-5" strokeWidth={1.75} />}
          </motion.span>
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
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={!me?.user ? "phone" : step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease }}
            className="flex flex-1 flex-col"
          >
            {!me?.user ? <WorkerPhoneLogin /> : step === "speak" ? <SpeakStep /> : step === "review" ? <ReviewStep /> : <PhotoStep />}
          </motion.div>
        </AnimatePresence>
      )}
    </WorkerShell>
  );
}
