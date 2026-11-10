"use client";
import { create } from "zustand";
import { api, uploadMedia } from "@/lib/client/api";
import type { JobDTO, MessageDTO } from "@/lib/types";
import { toast } from "@/stores/toast-store";

type JobState = {
  jobId: string | null;
  job: JobDTO | null;
  messages: MessageDTO[];
  loading: boolean;
  notFound: boolean;
  sending: boolean;
  acting: boolean;
  draftText: string;
  counterAmount: number | null;
  reviewOpen: boolean;

  open: (jobId: string) => () => void;
  refresh: () => Promise<void>;
  setDraftText: (t: string) => void;
  setCounter: (n: number | null) => void;
  setReviewOpen: (v: boolean) => void;
  sendText: () => Promise<void>;
  sendVoice: (r: { text: string; blob: Blob | null; mediaId: string | null }) => Promise<void>;
  sendOffer: (amount: number) => Promise<void>;
  accept: (messageId: string) => Promise<void>;
  close: (action: "decline" | "cancel") => Promise<void>;
  complete: () => Promise<void>;
  review: (input: {
    rating: number;
    tags: string[];
    paidAgreedPrice: boolean | null;
    wouldHireAgain: boolean | null;
    comment: string | null;
  }) => Promise<boolean>;
};

export const useJobStore = create<JobState>((set, get) => ({
  jobId: null,
  job: null,
  messages: [],
  loading: false,
  notFound: false,
  sending: false,
  acting: false,
  draftText: "",
  counterAmount: null,
  reviewOpen: false,

  open: (jobId) => {
    if (get().jobId !== jobId) {
      set({ jobId, job: null, messages: [], loading: true, notFound: false, draftText: "", counterAmount: null, reviewOpen: false });
    }
    void get().refresh();
    const t = setInterval(() => document.visibilityState === "visible" && void get().refresh(), 3000);
    return () => clearInterval(t);
  },

  refresh: async () => {
    const jobId = get().jobId;
    if (!jobId) return;
    try {
      const res = await api<{ job: JobDTO; messages: MessageDTO[] }>(`/api/jobs/${jobId}`);
      if (get().jobId !== jobId) return;
      const prev = get().job;
      // Seed the counter-offer stepper from the latest offer the first time we see one.
      const counter =
        get().counterAmount ?? res.job.pendingOffer?.amount ?? res.job.agreedPrice ?? res.job.worker.visitCharge;
      set({ job: res.job, messages: res.messages, loading: false, counterAmount: counter });
      if (prev && prev.status !== res.job.status) {
        if (res.job.status === "booked") toast.success("Job confirmed!", "کام پکا ہو گیا!");
        if (res.job.status === "completed" && res.job.viewerRole === "customer" && !res.job.hasReview)
          set({ reviewOpen: true });
      }
    } catch (e) {
      const status = (e as { status?: number }).status;
      set({ loading: false, notFound: status === 404 });
    }
  },

  setDraftText: (draftText) => set({ draftText }),
  setCounter: (counterAmount) => set({ counterAmount }),
  setReviewOpen: (reviewOpen) => set({ reviewOpen }),

  sendText: async () => {
    const text = get().draftText.trim();
    if (!text || !get().jobId) return;
    set({ sending: true, draftText: "" });
    try {
      const r = await api<{ detectedOffer: number | null }>(`/api/jobs/${get().jobId}/messages`, {
        method: "POST",
        json: { kind: "text", text },
      });
      if (r.detectedOffer) toast.info(`Price card created: Rs ${r.detectedOffer}`, `قیمت: ${r.detectedOffer} روپے`);
    } catch (e) {
      set({ draftText: text });
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      set({ sending: false });
      void get().refresh();
    }
  },

  sendVoice: async ({ text, blob, mediaId }) => {
    const jobId = get().jobId;
    if (!jobId) return;
    if (!blob && !mediaId && !text) return;
    set({ sending: true });
    try {
      const audioMediaId = mediaId ?? (blob ? (await uploadMedia(blob, "note.webm")).id : null);
      const r = await api<{ detectedOffer: number | null }>(`/api/jobs/${jobId}/messages`, {
        method: "POST",
        json: audioMediaId ? { kind: "voice", text: text || null, audioMediaId } : { kind: "text", text },
      });
      if (r.detectedOffer) toast.info(`Price card created: Rs ${r.detectedOffer}`, `قیمت: ${r.detectedOffer} روپے`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed", "پیغام نہیں گیا");
    } finally {
      set({ sending: false });
      void get().refresh();
    }
  },

  sendOffer: async (amount) => {
    const jobId = get().jobId;
    if (!jobId) return;
    set({ acting: true });
    try {
      await api(`/api/jobs/${jobId}/messages`, { method: "POST", json: { kind: "offer", offerAmount: amount } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      set({ acting: false });
      void get().refresh();
    }
  },

  accept: async (messageId) => {
    const jobId = get().jobId;
    if (!jobId) return;
    set({ acting: true });
    try {
      await api(`/api/jobs/${jobId}/accept`, { method: "POST", json: { messageId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm", "کام پکا نہیں ہو سکا");
    } finally {
      set({ acting: false });
      void get().refresh();
    }
  },

  close: async (action) => {
    const jobId = get().jobId;
    if (!jobId) return;
    set({ acting: true });
    try {
      await api(`/api/jobs/${jobId}/close`, { method: "POST", json: { action } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      set({ acting: false });
      void get().refresh();
    }
  },

  complete: async () => {
    const jobId = get().jobId;
    if (!jobId) return;
    set({ acting: true });
    try {
      await api(`/api/jobs/${jobId}/complete`, { method: "POST" });
      if (get().job?.viewerRole === "customer") set({ reviewOpen: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      set({ acting: false });
      void get().refresh();
    }
  },

  review: async (input) => {
    const jobId = get().jobId;
    if (!jobId) return false;
    set({ acting: true });
    try {
      await api(`/api/jobs/${jobId}/review`, { method: "POST", json: input });
      toast.success("Thanks! Your review helps the next customer.");
      set({ reviewOpen: false });
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      return false;
    } finally {
      set({ acting: false });
      void get().refresh();
    }
  },
}));
