"use client";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { useSessionStore } from "@/stores/session-store";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/stores/toast-store";

/** Last sign-up step for a new customer: a display name workers will see. */
export function CustomerName() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useSessionStore((s) => s.load);
  return (
    <form
      className="mx-auto flex w-full max-w-sm flex-col gap-3 py-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (name.trim().length < 2) return;
        setBusy(true);
        try {
          await api("/api/me", { method: "POST", json: { name: name.trim() } });
          await load(true);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="text-2xl font-bold">What should workers call you?</h1>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Ayesha"
        className="rounded-2xl bg-white px-4 py-3 text-lg ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
      />
      <button disabled={busy} className="flex h-12 items-center justify-center rounded-2xl bg-brand font-semibold text-white">
        {busy ? <Spinner /> : "Continue"}
      </button>
    </form>
  );
}
