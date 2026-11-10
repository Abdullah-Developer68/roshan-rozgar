"use client";
import { ClipboardList, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSessionStore } from "@/stores/session-store";
import { CustomerLogin } from "@/components/auth/customer-login";
import { CustomerName } from "@/components/auth/customer-name";
import { Spinner } from "@/components/ui/spinner";

/** Customer frame + auth gate. Children render only for a signed-in customer with a name. */
export function CustomerShell({ children }: { children: ReactNode }) {
  const me = useSessionStore((s) => s.me);
  const status = useSessionStore((s) => s.status);
  const load = useSessionStore((s) => s.load);
  const signOut = useSessionStore((s) => s.signOut);
  const router = useRouter();

  useEffect(() => {
    void load();
  }, [load]);

  const user = me?.user;
  let body: ReactNode = children;
  if (status !== "ready") body = <div className="flex flex-1 items-center justify-center"><Spinner className="size-8 text-brand" /></div>;
  else if (!user) body = <CustomerLogin />;
  else if (me?.worker)
    body = (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p>You&apos;re signed in as a worker ({me.worker.name}).</p>
        <button onClick={() => void signOut()} className="rounded-xl bg-brand px-4 py-2 text-white">Sign out to continue as a customer</button>
      </div>
    );
  else if (user.name === "New user") body = <CustomerName />;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 pb-28 pt-4">
      <header className="flex items-center justify-between">
        <Link href="/customer" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-lg">🪔</span>
          <span className="text-lg font-bold text-brand">Roshan Rozgar</span>
        </Link>
        {user && !me?.worker && (
          <nav className="flex items-center gap-2">
            <Link href="/customer/jobs" className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-line">
              <ClipboardList className="size-4" /> My jobs
            </Link>
            <button
              aria-label="Sign out"
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
              className="flex size-9 items-center justify-center rounded-full bg-white ring-1 ring-line"
            >
              <LogOut className="size-4" />
            </button>
          </nav>
        )}
      </header>
      {body}
    </div>
  );
}
