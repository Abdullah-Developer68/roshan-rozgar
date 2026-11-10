"use client";
import { create } from "zustand";
import { api, compressImage, uploadMedia } from "@/lib/client/api";
import { nearestArea } from "@/lib/areas";
import type { TradeId } from "@/lib/trades";
import type { WorkerPublic } from "@/lib/types";
import { useSessionStore } from "@/stores/session-store";

export type Draft = {
  name: string;
  nameUr: string;
  trade: TradeId | null;
  skills: string[];
  experienceYears: number | null;
  areaId: string | null;
  lat: number | null;
  lng: number | null;
  visitCharge: number | null;
  bioUr: string;
  bioEn: string;
};

export type FixField = "name" | "trade" | "experience" | "area" | "charge" | null;

const emptyDraft: Draft = {
  name: "",
  nameUr: "",
  trade: null,
  skills: [],
  experienceYears: null,
  areaId: null,
  lat: null,
  lng: null,
  visitCharge: null,
  bioUr: "",
  bioEn: "",
};

type OnboardingState = {
  step: "speak" | "review" | "photo";
  transcript: string;
  draft: Draft;
  source: "ai" | "fallback" | null;
  extracting: boolean;
  voiceIntroMediaId: string | null;
  photoMediaId: string | null;
  photoPreview: string | null;
  uploadingPhoto: boolean;
  locating: boolean;
  fixing: FixField;
  saving: boolean;
  error: string | null;
  setStep: (s: OnboardingState["step"]) => void;
  setTranscript: (t: string) => void;
  setField: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
  setFixing: (f: FixField) => void;
  extract: (transcript: string, audio: Blob | null, uploadedMediaId: string | null) => Promise<void>;
  locateMe: () => Promise<void>;
  setPhoto: (file: File) => Promise<void>;
  missing: () => (keyof Draft)[];
  save: () => Promise<WorkerPublic | null>;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  step: "speak",
  transcript: "",
  draft: emptyDraft,
  source: null,
  extracting: false,
  voiceIntroMediaId: null,
  photoMediaId: null,
  photoPreview: null,
  uploadingPhoto: false,
  locating: false,
  fixing: null,
  saving: false,
  error: null,

  setStep: (step) => set({ step }),
  setTranscript: (transcript) => set({ transcript }),
  setField: (k, v) => set({ draft: { ...get().draft, [k]: v } }),
  setFixing: (fixing) => set({ fixing }),

  extract: async (transcript, audio, uploadedMediaId) => {
    if (!transcript.trim()) {
      set({ error: "Kuch sunai nahi diya. Dobara bolein." });
      return;
    }
    set({ extracting: true, error: null, transcript });
    // Keep the worker's own voice as a "voice intro" customers can listen to.
    const voiceUpload =
      uploadedMediaId != null
        ? Promise.resolve(uploadedMediaId)
        : audio && audio.size > 2000
          ? uploadMedia(audio, "intro.webm").then((r) => r.id).catch(() => null)
          : Promise.resolve(null);
    try {
      const [res, voiceId] = await Promise.all([
        api<{ data: Omit<Draft, "lat" | "lng"> & { area: string | null }; source: "ai" | "fallback" }>(
          "/api/ai/worker-profile",
          { method: "POST", json: { transcript } },
        ),
        voiceUpload,
      ]);
      const d = res.data;
      const prev = get().draft;
      set({
        draft: {
          ...prev,
          name: d.name ?? prev.name,
          nameUr: d.nameUr ?? prev.nameUr,
          trade: d.trade ?? prev.trade,
          skills: d.skills?.length ? d.skills : prev.skills,
          experienceYears: d.experienceYears ?? prev.experienceYears,
          areaId: d.areaId ?? prev.areaId,
          visitCharge: d.visitCharge ?? prev.visitCharge,
          bioUr: d.bioUr || prev.bioUr,
          bioEn: d.bioEn || prev.bioEn,
        },
        source: res.source,
        voiceIntroMediaId: voiceId ?? get().voiceIntroMediaId,
        step: "review",
        extracting: false,
      });
    } catch (e) {
      set({ extracting: false, error: e instanceof Error ? e.message : "Failed" });
    }
  },

  locateMe: async () => {
    if (!navigator.geolocation) return;
    set({ locating: true });
    await new Promise<void>((resolve) =>
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const area = nearestArea(lat, lng);
          // Outside Islamabad/Rawalpindi (e.g. judge's laptop elsewhere) -> snap to the nearest known area.
          const inCity = Math.abs(lat - area.lat) < 0.2 && Math.abs(lng - area.lng) < 0.2;
          set({
            draft: { ...get().draft, areaId: area.id, lat: inCity ? lat : area.lat, lng: inCity ? lng : area.lng },
            locating: false,
            fixing: null,
          });
          resolve();
        },
        () => {
          set({ locating: false, fixing: "area" });
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10_000 },
      ),
    );
  },

  setPhoto: async (file) => {
    set({ uploadingPhoto: true, error: null });
    try {
      const blob = await compressImage(file, 640, 0.82);
      const up = await uploadMedia(blob, "photo.jpg");
      set({ photoMediaId: up.id, photoPreview: URL.createObjectURL(blob), uploadingPhoto: false });
    } catch (e) {
      set({ uploadingPhoto: false, error: e instanceof Error ? e.message : "Upload failed" });
    }
  },

  missing: () => {
    const d = get().draft;
    const m: (keyof Draft)[] = [];
    if (!d.name && !d.nameUr) m.push("name");
    if (!d.trade) m.push("trade");
    if (d.experienceYears == null) m.push("experienceYears");
    if (!d.areaId) m.push("areaId");
    if (d.visitCharge == null) m.push("visitCharge");
    return m;
  },

  save: async () => {
    const s = get();
    const d = s.draft;
    if (s.missing().length) {
      set({ error: "Kuch maloomat baqi hai" });
      return null;
    }
    set({ saving: true, error: null });
    try {
      const res = await api<{ worker: WorkerPublic }>("/api/worker/profile", {
        method: "PUT",
        json: {
          name: d.name || d.nameUr,
          nameUr: d.nameUr || null,
          trade: d.trade,
          skills: d.skills,
          experienceYears: Math.round(d.experienceYears ?? 0),
          areaId: d.areaId,
          lat: d.lat,
          lng: d.lng,
          visitCharge: Math.round(d.visitCharge ?? 0),
          bioUr: d.bioUr || null,
          bioEn: d.bioEn || null,
          photoMediaId: s.photoMediaId,
          voiceIntroMediaId: s.voiceIntroMediaId,
          transcript: s.transcript || null,
        },
      });
      await useSessionStore.getState().load(true);
      set({ saving: false });
      return res.worker;
    } catch (e) {
      set({ saving: false, error: e instanceof Error ? e.message : "Save failed" });
      return null;
    }
  },

  reset: () =>
    set({
      step: "speak",
      transcript: "",
      draft: emptyDraft,
      source: null,
      voiceIntroMediaId: null,
      photoMediaId: null,
      photoPreview: null,
      fixing: null,
      error: null,
    }),
}));
