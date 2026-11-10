"use client";
import { create } from "zustand";
import { api } from "@/lib/client/api";
import { authClient } from "@/lib/auth-client";
import { normalizePkPhone } from "@/lib/phone";
import { useSessionStore } from "@/stores/session-store";

type Sms = { body: string; code: string; createdAt: string };

type LoginState = {
  digits: string;
  step: "phone" | "code";
  code: string;
  sms: Sms | null;
  busy: boolean;
  error: string | null;
  pressDigit: (d: string) => void;
  backspace: () => void;
  setDigits: (d: string) => void;
  setCode: (c: string) => void;
  sendCode: () => Promise<boolean>;
  verify: () => Promise<boolean>;
  /** One-tap sign-in for seeded demo accounts (runs the same OTP flow). */
  demoSignIn: (phone: string) => Promise<boolean>;
  reset: () => void;
};

async function readSimulatedSms(phone: string): Promise<Sms | null> {
  for (let i = 0; i < 8; i++) {
    const { sms } = await api<{ sms: Sms | null }>(`/api/sms/outbox?phone=${encodeURIComponent(phone)}`);
    if (sms) return sms;
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

export const useLoginStore = create<LoginState>((set, get) => ({
  digits: "",
  step: "phone",
  code: "",
  sms: null,
  busy: false,
  error: null,

  pressDigit: (d) => {
    const cur = get().digits;
    if (cur.length >= 11) return;
    set({ digits: cur + d, error: null });
  },
  backspace: () => set({ digits: get().digits.slice(0, -1), error: null }),
  setDigits: (d) => set({ digits: d.replace(/\D/g, "").slice(0, 11), error: null }),
  setCode: (c) => set({ code: c.replace(/\D/g, "").slice(0, 6), error: null }),

  sendCode: async () => {
    const phone = normalizePkPhone(get().digits);
    if (!phone) {
      set({ error: "Enter a mobile number like 03001234567" });
      return false;
    }
    set({ busy: true, error: null, sms: null, code: "" });
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
    if (error) {
      set({ busy: false, error: error.message ?? "Could not send code" });
      return false;
    }
    set({ step: "code" });
    // Simulated SMS gateway: fetch the "delivered" SMS and auto-fill it, like Android's SMS autofill.
    const sms = await readSimulatedSms(phone).catch(() => null);
    set({ sms, code: sms?.code ?? "", busy: false });
    return true;
  },

  verify: async () => {
    const phone = normalizePkPhone(get().digits);
    if (!phone) return false;
    set({ busy: true, error: null });
    const { error } = await authClient.phoneNumber.verify({ phoneNumber: phone, code: get().code });
    if (error) {
      set({ busy: false, error: error.message ?? "Wrong code" });
      return false;
    }
    await useSessionStore.getState().load(true);
    set({ busy: false });
    return true;
  },

  demoSignIn: async (phone) => {
    set({ digits: phone.replace("+92", "0") });
    const sent = await get().sendCode();
    if (!sent || !get().code) return false;
    return get().verify();
  },

  reset: () => set({ digits: "", step: "phone", code: "", sms: null, busy: false, error: null }),
}));
