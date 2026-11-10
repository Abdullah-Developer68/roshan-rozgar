"use client";
import { ClipboardList, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSessionStore } from "@/stores/session-store";
import { CustomerLogin } from "@/components/auth/customer-login";
import { CustomerName } from "@/components/auth/customer-name";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { LangToggle } from "@/components/ui/lang-toggle";
import { Logo } from "@/components/shared/logo";
import { useT } from "@/lib/i18n";

/** Customer frame + auth gate. Children render only for a signed-in customer with a name. */
export function CustomerShell({ children }: { children: ReactNode }) {
  const me = useSessionStore((s) => s.me);
  const status = useSessionStore((s) => s.status);
  const load = useSessionStore((s) => s.load);
  const signOut = useSessionStore((s) => s.signOut);
  const router = useRouter();
  const { t, dir, langClass, lang } = useT();

  useEffect(() => {
    void load();
  }, [load]);

  const user = me?.user;
  let body: ReactNode = children;
  if (status !== "ready") body = <div className="flex flex-1 items-center justify-center py-20"><Spinner className="size-6 text-muted-foreground" /></div>;
  else if (!user) body = <CustomerLogin />;
  else if (me?.worker)
    body = (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p>{t("signedInAsWorker", { name: me.worker.name })}</p>
        <Button onClick={() => void signOut()}>{t("signOutToCustomer")}</Button>
      </div>
    );
  else if (user.name === "New user") body = <CustomerName />;

  return (
    <div className={`flex flex-1 flex-col ${langClass}`} dir={dir} lang={lang}>
      <header className="sticky top-0 z-[600] border-b border-hairline bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
          <Logo href="/customer" />
          <nav className="ms-auto flex items-center gap-2">
            <LangToggle />
            {user && !me?.worker && (
              <>
                <Button asChild variant="outline" size="sm" className="h-8 rounded-lg">
                  <Link href="/customer/jobs">
                    <ClipboardList /> <span className="hidden min-[400px]:inline">{t("myJobs")}</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("signOut")}
                  onClick={async () => {
                    await signOut();
                    router.replace("/");
                  }}
                >
                  <LogOut />
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 pb-28 pt-6">{body}</div>
    </div>
  );
}
