"use client";
import { create } from "zustand";
import { api } from "@/lib/client/api";
import type { JobDTO, PriceStats, ReviewDTO, WorkerPublic } from "@/lib/types";

/** Customer-side read models: a worker's public profile and the customer's job list. */
type BrowseState = {
  profile: { worker: WorkerPublic; reviews: ReviewDTO[]; priceStats: PriceStats } | null;
  profileId: string | null;
  profileLoading: boolean;
  loadProfile: (id: string) => Promise<void>;

  myJobs: JobDTO[] | null;
  loadMyJobs: () => Promise<void>;
  pollMyJobs: () => () => void;
};

export const useBrowseStore = create<BrowseState>((set, get) => ({
  profile: null,
  profileId: null,
  profileLoading: false,
  loadProfile: async (id) => {
    if (get().profileId !== id) set({ profile: null, profileId: id });
    set({ profileLoading: true });
    try {
      const res = await api<{ worker: WorkerPublic; reviews: ReviewDTO[]; priceStats: PriceStats }>(`/api/workers/${id}`);
      if (get().profileId === id) set({ profile: res });
    } finally {
      set({ profileLoading: false });
    }
  },

  myJobs: null,
  loadMyJobs: async () => {
    try {
      const res = await api<{ jobs: JobDTO[] }>("/api/jobs");
      set({ myJobs: res.jobs });
    } catch {
      set({ myJobs: [] });
    }
  },
  pollMyJobs: () => {
    void get().loadMyJobs();
    const t = setInterval(() => document.visibilityState === "visible" && void get().loadMyJobs(), 5000);
    return () => clearInterval(t);
  },
}));
