"use client";
import { useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useLangStore } from "@/stores/lang-store";

/** Loads the saved language choice after hydration and mirrors it onto <html lang>. */
export function LangSync() {
  const { lang } = useT();
  useEffect(() => {
    void useLangStore.persist.rehydrate();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
