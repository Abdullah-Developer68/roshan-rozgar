"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useVoiceStore } from "@/stores/voice-store";

export type Lang = "en" | "ur";

type LangState = {
  /** null = no explicit choice yet: worker screens default to Urdu, everything else to English. */
  pref: Lang | null;
  setLang: (l: Lang) => void;
};

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      pref: null,
      setLang: (pref) => {
        set({ pref });
        // Speaking follows the chosen language too (the mic still has its own override).
        useVoiceStore.getState().setSttLang(pref === "ur" ? "ur-PK" : "en-US");
      },
    }),
    {
      name: "rr-lang",
      storage: createJSONStorage(() => localStorage),
      // Rehydrated on the client in <LangSync/> so server and first client render match.
      skipHydration: true,
      partialize: (s) => ({ pref: s.pref }),
    },
  ),
);
