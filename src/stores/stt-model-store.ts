"use client";
import { create } from "zustand";

/** Download/readiness state of the on-device Whisper model (shown under the mic). */
type SttModelState = {
  status: "idle" | "loading" | "ready" | "error";
  progress: number;
  totalMb: number | null;
  error: string | null;
  set: (p: Partial<Omit<SttModelState, "set">>) => void;
};

export const useSttModelStore = create<SttModelState>((set) => ({
  status: "idle",
  progress: 0,
  totalMb: null,
  error: null,
  set: (p) => set(p),
}));
