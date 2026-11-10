"use client";
import { create } from "zustand";
import { api, compressImage, uploadMedia } from "@/lib/client/api";
import { DEFAULT_AREA_ID, getArea, nearestArea } from "@/lib/areas";
import type { TradeId } from "@/lib/trades";
import type { PriceStats, WorkerSearchResult } from "@/lib/types";
import { toast } from "@/stores/toast-store";

export type TriageResult = {
  trade: TradeId | null;
  summaryEn: string;
  summaryUr: string;
  urgency: "low" | "normal" | "urgent";
  estimateMin: number | null;
  estimateMax: number | null;
  safetyTipEn: string | null;
  safetyTipUr: string | null;
};

type RequestState = {
  problemText: string;
  photoMediaId: string | null;
  photoPreview: string | null;
  uploadingPhoto: boolean;
  areaId: string;
  lat: number;
  lng: number;
  locSource: "default" | "gps" | "area";
  locating: boolean;
  addressNote: string;
  triage: TriageResult | null;
  triageSource: "ai" | "fallback" | null;
  priceStats: PriceStats | null;
  triaging: boolean;
  trade: TradeId | null;
  radiusKm: number;
  results: WorkerSearchResult[] | null;
  searching: boolean;
  selected: string[];
  offerAmount: number | null;
  sending: boolean;
  focusedWorkerId: string | null;

  setProblemText: (t: string) => void;
  setPhoto: (f: File) => Promise<void>;
  clearPhoto: () => void;
  setArea: (id: string) => void;
  locateMe: () => Promise<void>;
  setAddressNote: (t: string) => void;
  setTrade: (t: TradeId) => void;
  runTriage: () => Promise<void>;
  search: () => Promise<void>;
  setRadius: (km: number) => void;
  toggleSelected: (id: string) => void;
  setOffer: (n: number | null) => void;
  setFocused: (id: string | null) => void;
  sendRequests: () => Promise<string[] | null>;
  reset: () => void;
};

const area0 = getArea(DEFAULT_AREA_ID);

const initial = {
  problemText: "",
  photoMediaId: null,
  photoPreview: null,
  uploadingPhoto: false,
  areaId: area0.id,
  lat: area0.lat,
  lng: area0.lng,
  locSource: "default" as const,
  locating: false,
  addressNote: "",
  triage: null,
  triageSource: null,
  priceStats: null,
  triaging: false,
  trade: null,
  radiusKm: 8,
  results: null,
  searching: false,
  selected: [],
  offerAmount: null,
  sending: false,
  focusedWorkerId: null,
};

export const useRequestStore = create<RequestState>((set, get) => ({
  ...initial,

  setProblemText: (problemText) => set({ problemText }),
  setPhoto: async (file) => {
    set({ uploadingPhoto: true });
    try {
      const blob = await compressImage(file, 1024, 0.8);
      const up = await uploadMedia(blob, "problem.jpg");
      set({ photoMediaId: up.id, photoPreview: URL.createObjectURL(blob), uploadingPhoto: false });
    } catch (e) {
      set({ uploadingPhoto: false });
      toast.error(e instanceof Error ? e.message : "Photo upload failed");
    }
  },
  clearPhoto: () => set({ photoMediaId: null, photoPreview: null }),
  setArea: (id) => {
    const a = getArea(id);
    set({ areaId: a.id, lat: a.lat, lng: a.lng, locSource: "area" });
    if (get().results) void get().search();
  },
  locateMe: async () => {
    if (!navigator.geolocation) return toast.error("Location not available on this device");
    set({ locating: true });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const a = nearestArea(lat, lng);
        const inCity = Math.abs(lat - a.lat) < 0.2 && Math.abs(lng - a.lng) < 0.2;
        if (!inCity) toast.info(`You're outside Islamabad/Rawalpindi — using ${a.en} for the demo.`);
        set({ areaId: a.id, lat: inCity ? lat : a.lat, lng: inCity ? lng : a.lng, locSource: "gps", locating: false });
        if (get().results) void get().search();
      },
      () => {
        set({ locating: false });
        toast.error("Couldn't get your location. Pick your area instead.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  },
  setAddressNote: (addressNote) => set({ addressNote }),
  setTrade: (trade) => {
    set({ trade, selected: [] });
    void get().search();
  },

  runTriage: async () => {
    const { problemText, photoMediaId } = get();
    if (!problemText.trim() && !photoMediaId) return toast.error("Describe the problem or add a photo");
    set({ triaging: true, results: null, selected: [] });
    try {
      const res = await api<{ data: TriageResult; source: "ai" | "fallback"; priceStats: PriceStats | null }>(
        "/api/triage",
        { method: "POST", json: { text: problemText, photoMediaId } },
      );
      const t = res.data;
      const suggested = t.estimateMin && t.estimateMax ? Math.round((t.estimateMin + t.estimateMax) / 2 / 100) * 100 : null;
      set({
        triage: t,
        triageSource: res.source,
        priceStats: res.priceStats,
        trade: t.trade,
        offerAmount: res.priceStats?.median ?? suggested,
        triaging: false,
      });
      if (t.trade) await get().search();
    } catch (e) {
      set({ triaging: false });
      toast.error(e instanceof Error ? e.message : "Could not analyse the problem");
    }
  },

  search: async () => {
    const { trade, lat, lng, radiusKm } = get();
    if (!trade) return;
    set({ searching: true });
    try {
      const res = await api<{ workers: WorkerSearchResult[] }>("/api/workers/search", {
        method: "POST",
        json: { trade, lat, lng, radiusKm },
      });
      const available = new Set(res.workers.filter((w) => w.availability === "available").map((w) => w.id));
      set({ results: res.workers, searching: false, selected: get().selected.filter((id) => available.has(id)) });
    } catch (e) {
      set({ searching: false });
      toast.error(e instanceof Error ? e.message : "Search failed");
    }
  },
  setRadius: (radiusKm) => {
    set({ radiusKm });
    void get().search();
  },
  toggleSelected: (id) => {
    const sel = get().selected;
    if (sel.includes(id)) set({ selected: sel.filter((x) => x !== id) });
    else if (sel.length >= 3) toast.info("You can ask up to 3 workers at once");
    else set({ selected: [...sel, id] });
  },
  setOffer: (offerAmount) => set({ offerAmount }),
  setFocused: (focusedWorkerId) => set({ focusedWorkerId }),

  sendRequests: async () => {
    const s = get();
    if (!s.trade || !s.selected.length) return null;
    set({ sending: true });
    try {
      const res = await api<{ jobIds: string[]; skipped: number }>("/api/jobs", {
        method: "POST",
        json: {
          workerIds: s.selected,
          trade: s.trade,
          problemText: s.problemText.trim() || s.triage?.summaryEn || "See photo",
          summaryEn: s.triage?.summaryEn ?? null,
          summaryUr: s.triage?.summaryUr || null,
          triageSource: s.triageSource,
          photoMediaId: s.photoMediaId,
          areaId: s.areaId,
          lat: s.lat,
          lng: s.lng,
          addressNote: s.addressNote || null,
          offerAmount: s.offerAmount,
        },
      });
      if (res.skipped) toast.info(`${res.skipped} worker(s) became unavailable and were skipped`);
      set({ sending: false });
      return res.jobIds;
    } catch (e) {
      set({ sending: false });
      toast.error(e instanceof Error ? e.message : "Could not send request");
      void get().search();
      return null;
    }
  },

  reset: () => set({ ...initial }),
}));
