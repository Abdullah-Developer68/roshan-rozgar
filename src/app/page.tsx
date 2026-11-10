import { BadgeCheck, Languages, MapPinned, Mic, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DemoPanel } from "@/components/shared/demo-panel";

const STEPS = [
  { icon: Mic, title: "Join by speaking", text: "Workers say their name, trade, experience, area and fee in Urdu. AI fills the profile — no form, no typing." },
  { icon: MapPinned, title: "Nearby & free now", text: "Customers see only workers who are online and not already on a job, ranked by distance and verified reviews." },
  { icon: Languages, title: "Talk in your language", text: "Voice notes are transcribed and translated both ways. A spoken price becomes a one-tap price card." },
  { icon: ShieldCheck, title: "Booked = engaged", text: "Accepting a price books the worker atomically; their other requests close and they vanish from search until done." },
  { icon: BadgeCheck, title: "Trust that compounds", text: "Only real, completed jobs can be reviewed. Price honesty and AI review summaries help the next household decide." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-6">
      <header className="flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-xl">🪔</span>
        <span className="text-xl font-bold text-brand">Roshan Rozgar</span>
        <span className="urdu text-xl text-brand" lang="ur">· روشن روزگار</span>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/worker/join"
          className="group flex min-h-56 flex-col justify-between rounded-[2rem] bg-brand p-6 text-white shadow-xl transition active:scale-[0.99]"
          dir="rtl"
        >
          <span className="text-6xl" aria-hidden>🧰</span>
          <span>
            <span className="urdu block text-4xl font-bold leading-[1.9]" lang="ur">میں کاریگر ہوں</span>
            <span className="urdu block text-lg text-white/85" lang="ur">بول کر پروفائل بنائیں · کام پائیں</span>
            <span className="mt-1 block text-sm text-white/70" dir="ltr">I&apos;m a worker — join by voice</span>
          </span>
        </Link>
        <Link
          href="/customer"
          className="flex min-h-56 flex-col justify-between rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-line transition active:scale-[0.99]"
        >
          <span className="text-6xl" aria-hidden>🏠</span>
          <span>
            <span className="block text-3xl font-bold">I need a worker</span>
            <span className="block text-muted">Electrician, plumber, AC technician and more — near you, free right now.</span>
            <span className="urdu block text-lg text-muted" lang="ur" dir="rtl">مجھے کاریگر چاہیے</span>
          </span>
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-3xl bg-white p-4 ring-1 ring-line">
            <s.icon className="mb-2 size-6 text-brand" />
            <h3 className="font-semibold">{s.title}</h3>
            <p className="text-sm text-muted">{s.text}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-sun-soft p-5 ring-1 ring-amber-200">
          <h2 className="mb-1 font-bold">Demo accounts</h2>
          <p className="mb-3 text-sm text-amber-950/80">
            One tap signs in through the real phone-OTP flow. Open the worker in a second browser (or incognito) to watch both sides live.
          </p>
          <DemoPanel />
        </div>
        <div className="rounded-3xl bg-white p-5 text-sm ring-1 ring-line">
          <h2 className="mb-2 font-bold">What&apos;s real and what&apos;s simulated</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li><b className="text-ink">Real:</b> accounts, sessions, profiles, search, chat, price agreement, booking locks, reviews, AI calls (OpenRouter free models), speech recognition (browser).</li>
            <li><b className="text-ink">Simulated:</b> SMS delivery — OTP codes appear in an on-screen &quot;SMS&quot; banner. 34 workers, their past jobs and reviews are seeded demo data (labelled).</li>
            <li><b className="text-ink">Out of scope:</b> payments and CNIC verification.</li>
            <li>When the free AI quota runs out, features fall back to rule-based parsing and are labelled <i>Basic (AI offline)</i>.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
