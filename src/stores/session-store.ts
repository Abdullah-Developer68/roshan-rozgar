"use client";
import { create } from "zustand";
import { api } from "@/lib/client/api";
import { authClient } from "@/lib/auth-client";
import type { MeDTO } from "@/lib/types";

type SessionState = {
  me: MeDTO | null;
  status: "idle" | "loading" | "ready";
  load: (force?: boolean) => Promise<MeDTO>;
  signOut: () => Promise<void>;
};

let inflight: Promise<MeDTO> | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  me: null,
  status: "idle",
  load: async (force = false) => {
    const cur = get();
    if (!force && cur.status === "ready" && cur.me) return cur.me;
    if (!force && inflight) return inflight;
    set({ status: cur.me ? "ready" : "loading" });
    inflight = api<MeDTO>("/api/me")
      .catch(() => ({ user: null, worker: null }) as MeDTO)
      .then((me) => {
        set({ me, status: "ready" });
        inflight = null;
        return me;
      });
    return inflight;
  },
  signOut: async () => {
    await authClient.signOut().catch(() => {});
    set({ me: { user: null, worker: null }, status: "ready" });
  },
}));
