"use client";
import { Camera, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { SpeakButton, useAutoSpeak } from "@/components/ui/speak-button";
import { Spinner } from "@/components/ui/spinner";
import { P } from "@/lib/phrases";
import { useT } from "@/lib/i18n";

export function PhotoStep() {
  const router = useRouter();
  const preview = useOnboardingStore((s) => s.photoPreview);
  const uploading = useOnboardingStore((s) => s.uploadingPhoto);
  const setPhoto = useOnboardingStore((s) => s.setPhoto);
  const save = useOnboardingStore((s) => s.save);
  const saving = useOnboardingStore((s) => s.saving);
  const error = useOnboardingStore((s) => s.error);
  const reset = useOnboardingStore((s) => s.reset);
  const { t } = useT();
  useAutoSpeak(P.photo);

  const finish = async () => {
    const w = await save();
    if (w) {
      reset();
      router.replace("/worker");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("photoTitle")}</h1>
          <p className="text-xs text-muted">{t("photoSub")}</p>
        </div>
        <SpeakButton ur={P.photo.ur} hi={P.photo.hi} en={P.photo.en} size="lg" />
      </div>

      <label className="relative mx-auto flex size-56 cursor-pointer items-center justify-center overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-2 ring-dashed ring-brand/40 active:scale-[0.98]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={t("photoTitle")} className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-brand">
            <Camera className="size-20" />
            <span className="text-lg">{t("takePhoto")}</span>
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Spinner className="size-10 text-brand" />
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void setPhoto(f);
          }}
        />
      </label>

      {error && <p className="rounded-2xl bg-red-50 p-3 text-center text-sm text-red-800">{error}</p>}

      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={() => void finish()}
          disabled={saving || uploading}
          className="flex h-20 items-center justify-center gap-3 rounded-3xl bg-ok text-white shadow-lg active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? <Spinner className="size-9" /> : <Check className="size-10" strokeWidth={3} />}
          <span className="text-2xl font-bold">{preview ? t("finishProfile") : t("skipPhoto")}</span>
        </button>
      </div>
    </div>
  );
}
