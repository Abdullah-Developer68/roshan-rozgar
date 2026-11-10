"use client";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { useSessionStore } from "@/stores/session-store";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/stores/toast-store";
import { useT } from "@/lib/i18n";

/** Last sign-up step for a new customer: a display name workers will see. */
export function CustomerName() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useSessionStore((s) => s.load);
  const { t } = useT();
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
      <h1 className="text-2xl font-semibold">{t("nameTitle")}</h1>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("namePh")}
        className="rounded-lg bg-card px-4 py-3 text-lg border border-border outline-none focus:ring-2 focus:ring-brand"
      />
      <button disabled={busy} className="flex h-12 items-center justify-center rounded-lg bg-brand font-semibold text-white">
        {busy ? <Spinner /> : t("continue")}
      </button>
    </form>
  );
}
