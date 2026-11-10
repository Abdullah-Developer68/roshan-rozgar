"use client";
import { create } from "zustand";

export type Toast = { id: number; text: string; textUr?: string; kind: "info" | "success" | "error" };

type ToastState = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-2), { ...t, id }] });
    setTimeout(() => get().dismiss(id), t.kind === "error" ? 6000 : 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  info: (text: string, textUr?: string) => useToastStore.getState().push({ text, textUr, kind: "info" }),
  success: (text: string, textUr?: string) => useToastStore.getState().push({ text, textUr, kind: "success" }),
  error: (text: string, textUr?: string) => useToastStore.getState().push({ text, textUr, kind: "error" }),
};
