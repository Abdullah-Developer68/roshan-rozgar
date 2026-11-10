"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";

/** Brand mark: a rising sun (روشن = bright) in a rounded square. */
export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6" className="fill-foreground" />
      <path d="M6 16.5a6 6 0 0 1 12 0Z" className="fill-background" />
      <path d="M12 5.5v2.2M6.2 8.3l1.5 1.5M17.8 8.3l-1.5 1.5" className="stroke-background" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4.5 18.5h15" className="stroke-background" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  const { t } = useT();
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2">
      <LogoMark />
      <span className="truncate text-[17px] font-medium tracking-tight">{t("brand")}</span>
    </Link>
  );
}
