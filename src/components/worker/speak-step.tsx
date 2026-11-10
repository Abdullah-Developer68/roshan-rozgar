"use client";
import { Keyboard, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useVoiceStore } from "@/stores/voice-store";
import { MicButton } from "@/components/ui/mic-button";
import { SpeakButton, useAutoSpeak } from "@/components/ui/speak-button";
import { Spinner } from "@/components/ui/spinner";
import { P } from "@/lib/phrases";
import { sttSupported } from "@/lib/client/speech";
import { useT, type MsgKey } from "@/lib/i18n";

const HINTS: { icon: string; key: MsgKey }[] = [
  { icon: "👤", key: "hintName" },
  { icon: "🔧", key: "hintWork" },
  { icon: "📅", key: "hintExp" },
  { icon: "📍", key: "hintArea" },
  { icon: "💰", key: "hintFee" },
];

/** Which language the microphone listens for (defaults to the UI language). */
function MicLangToggle() {
  const sttLang = useVoiceStore((s) => s.sttLang);
  const setSttLang = useVoiceStore((s) => s.setSttLang);
  return (
    <div className="flex justify-center gap-2" dir="ltr">
      {(
        [
          ["ur-PK", "اردو"],
          ["en-US", "English"],
        ] as const
      ).map(([v, label]) => (
        <button
          key={v}
          onClick={() => setSttLang(v)}
          className={`rounded-full px-4 py-1 text-sm font-semibold ${sttLang === v ? "bg-brand text-white" : "bg-white text-muted ring-1 ring-line"}`}
        >
          🎤 <span className={v === "ur-PK" ? "font-urdu" : "font-sans"}>{label}</span>
        </button>
      ))}
    </div>
  );
}

function LiveTranscript() {
  const finalText = useVoiceStore((s) => s.finalText);
  const interim = useVoiceStore((s) => s.interim);
  const status = useVoiceStore((s) => s.status);
  const error = useVoiceStore((s) => s.error);
  const { t } = useT();
  const text = `${finalText} ${interim}`.trim();
  return (
    <div className="min-h-24 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line" aria-live="polite">
      {text ? (
        <p className="urdu text-lg" dir="auto">{text}</p>
      ) : status === "listening" ? (
        <p className="text-center text-lg text-muted">{t("listening")}</p>
      ) : (
        <p className="text-center text-3xl tracking-widest text-zinc-300">• • •</p>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function SpeakStep() {
  const extract = useOnboardingStore((s) => s.extract);
  const extracting = useOnboardingStore((s) => s.extracting);
  const error = useOnboardingStore((s) => s.error);
  const setStep = useOnboardingStore((s) => s.setStep);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const { t, pick } = useT();
  useAutoSpeak(P.speak);

  if (extracting)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Spinner className="size-14 text-brand" />
        <p className="text-xl">{pick(P.thinking.en, P.thinking.ur)}</p>
        <p className="text-xs text-muted">{t("aiBuilding")}</p>
      </div>
    );

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("speakTitle")}</h1>
          <p className="text-xs text-muted">{t("speakSub")}</p>
        </div>
        <SpeakButton ur={P.speak.ur} hi={P.speak.hi} en={P.speak.en} size="lg" />
      </div>

      <ul className="grid grid-cols-5 gap-2">
        {HINTS.map((h) => (
          <li key={h.key} className="flex flex-col items-center rounded-2xl bg-white py-2 shadow-sm ring-1 ring-line">
            <span className="text-2xl" aria-hidden>{h.icon}</span>
            <span className="text-sm">{t(h.key)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-3 py-2">
        <MicButton id="onboard" record onDone={(r) => void extract(r.text, r.blob, r.mediaId)} />
        <MicLangToggle />
        {!sttSupported() && <p className="text-center text-xs text-muted">{t("noStt")}</p>}
      </div>

      <LiveTranscript />

      <div className="flex items-center gap-3 rounded-2xl bg-sun-soft p-3 ring-1 ring-amber-200">
        <SpeakButton ur={P.example.ur} hi={P.example.hi} en={P.example.en} />
        <p className="text-sm text-amber-900">
          <b>{t("example")}</b> {pick(P.example.en, P.example.ur)}
        </p>
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-3 text-center text-sm text-red-800">{error}</p>}

      <div className="mt-auto flex justify-center gap-4 text-sm text-muted">
        <button onClick={() => setTyping((v) => !v)} className="flex items-center gap-1 underline">
          <Keyboard className="size-4" /> {t("typeInstead")}
        </button>
        <button onClick={() => setStep("review")} className="flex items-center gap-1 underline">
          <LayoutGrid className="size-4" /> {t("pickPictures")}
        </button>
      </div>
      {typing && (
        <div className="flex flex-col gap-2">
          <textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            rows={3}
            dir="auto"
            placeholder="Mera naam Aslam hai, electrician hoon, 15 saal tajurba, G-9, 500 rupay fee"
            className="rounded-2xl bg-white p-3 ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
          />
          <button onClick={() => void extract(typed, null, null)} className="h-11 rounded-2xl bg-brand font-semibold text-white">
            {t("makeProfile")}
          </button>
        </div>
      )}
    </div>
  );
}
