"use client";
import { create } from "zustand";
import { api } from "@/lib/client/api";
import type { JobDTO, WorkerPublic } from "@/lib/types";
import { toast } from "@/stores/toast-store";

type Inbox = { worker: WorkerPublic; active: JobDTO | null; requests: JobDTO[]; recent: JobDTO[] };

type WorkerDashState = {
  worker: WorkerPublic | null;
  active: JobDTO | null;
  requests: JobDTO[];
  recent: JobDTO[];
  loaded: boolean;
  toggling: boolean;
  /** ids of requests we've already notified about (for the "new job" chime). */
  seen: Set<string>;
  refresh: () => Promise<void>;
  startPolling: () => () => void;
  toggleOnline: () => Promise<void>;
  decline: (jobId: string) => Promise<void>;
};

function chime() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start();
    o.stop(ctx.currentTime + 0.6);
  } catch {
    /* autoplay restrictions */
  }
  navigator.vibrate?.([200, 100, 200]);
}

export const useWorkerDashStore = create<WorkerDashState>((set, get) => ({
  worker: null,
  active: null,
  requests: [],
  recent: [],
  loaded: false,
  toggling: false,
  seen: new Set(),

  refresh: async () => {
    try {
      const inbox = await api<Inbox>("/api/worker/inbox");
      const { seen, loaded } = get();
      const fresh = inbox.requests.filter((r) => !seen.has(r.id));
      if (loaded && fresh.length) chime();
      set({
        ...inbox,
        loaded: true,
        seen: new Set([...seen, ...inbox.requests.map((r) => r.id)]),
      });
    } catch {
      set({ loaded: true });
    }
  },

  startPolling: () => {
    void get().refresh();
    const t = setInterval(() => document.visibilityState === "visible" && void get().refresh(), 4000);
    return () => clearInterval(t);
  },

  toggleOnline: async () => {
    const w = get().worker;
    if (!w) return;
    set({ toggling: true });
    try {
      const res = await api<{ worker: WorkerPublic }>("/api/worker/status", {
        method: "POST",
        json: { isOnline: !w.isOnline },
      });
      set({ worker: res.worker, toggling: false });
    } catch (e) {
      set({ toggling: false });
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  },

  decline: async (jobId) => {
    set({ requests: get().requests.filter((r) => r.id !== jobId) });
    try {
      await api(`/api/jobs/${jobId}/close`, { method: "POST", json: { action: "decline" } });
    } finally {
      void get().refresh();
    }
  },
}));
