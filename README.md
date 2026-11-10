# Roshan Rozgar · روشن روزگار

A hyper-local marketplace that connects households in **Islamabad & Rawalpindi** with nearby skilled trade workers (electricians, plumbers, AC technicians, carpenters, mechanics, painters, masons, welders).

It is built for **workers who don't read or type comfortably**. A worker joins by *speaking* for 30 seconds, sees and hears their profile as picture cards, and negotiates jobs with voice notes and big +/- price buttons. Customers describe a problem by voice, text (English / Urdu / Roman Urdu) or photo, see who is **nearby and free right now**, agree a price, book, and leave a review that is tied to a real completed job.

> CUI Tech Fest · AI Web Forge — Problem Statement 1 (Roshan Rozgar)

**Live demo:** https://roshan-rozgar-two.vercel.app — use the one-tap demo accounts on the home page (customer **Ayesha** and worker **Muhammad Aslam**), ideally in two different browsers side by side.

---

## The five required outcomes, and how they work

| Outcome | How it's achieved |
|---|---|
| **1. Onboarding without forms** | Phone number on a big numeric keypad → OTP auto-filled → the worker taps the mic and says *"Mera naam Aslam hai, bijli ka kaam karta hoon, pandrah saal tajurba, G-9, paanch sau rupay fee"*. Speech is transcribed in the browser (Urdu `ur-PK`) and an LLM turns it into a structured profile (name, trade, skills, years, area, visit fee, Urdu/English bio). The worker reviews it as icon cards, each with a 🔊 read-aloud button, and fixes any card by voice, picture grid, GPS button or +/- stepper. Their recording becomes a "voice intro" customers can play. Every instruction is spoken aloud (Urdu voice, or a Hindi voice reading a Devanagari version when the device has no Urdu voice). |
| **2. Discovery** | Customer speaks/types/photographs the problem → AI triage picks the trade, writes an English + simple-Urdu job summary, flags urgency with a safety tip and estimates a price. Search returns workers of that trade within a radius (map + list). Only workers who are **online and not engaged on a booked job** can be selected; busy/offline workers are shown greyed out for transparency. Ranking blends Bayesian-smoothed rating, distance, verified job count and experience. |
| **3. Communication** | Per-job thread with **voice notes** and text. Every message is transcribed + translated by AI (Urdu for the worker, with read-aloud; English for the customer). If someone *says* a price ("barah sau lagenge"), the AI turns it into a **one-tap price card**. Workers can also counter with +/- buttons — no typing needed. Phone numbers are hidden until booking. |
| **4. Booking consistency** | Accepting the other side's price card books the job in **one transaction**: the worker row is locked (`SELECT … FOR UPDATE`), a **partial unique index** (`one booked job per worker`) is the last line of defence, the worker's other open requests are expired ("worker became busy"), and the customer's parallel requests for the same problem are cancelled. The worker disappears from search until they tap **کام مکمل (job done)**. The smoke test fires two simultaneous bookings and asserts exactly one wins. |
| **5. Trust** | Only the customer of a **completed** booking can review, once. Reviews capture stars, tags (On time / Fair price / Late / Overcharged…), *"did you pay the agreed price?"*, *"would you hire again?"* and a spoken/typed comment. The worker profile shows verified-job count, % charged as agreed, % would rehire, platform price bands per trade, and an **AI summary of all reviews** (in English and Urdu) that is regenerated after each new review. |

### What would stop working without AI?
- **Onboarding**: a worker would have to fill a typed form — exactly the barrier the brief describes. (Without the LLM we fall back to a keyword/number parser that handles simple sentences, plus the tap-only picture flow.)
- **Communication**: an Urdu voice note would reach an English-reading customer untranslated, and spoken prices would not become price cards.
- **Discovery**: a customer who only knows "the AC is dripping" or has a photo would have to know which trade to call; no Urdu summary for the worker.
- **Trust**: the next customer would have to read dozens of reviews instead of a balanced two-line summary.

---

## Tech stack

- **Next.js 16** (App Router, Cache Components / PPR), **React 19**, **TypeScript**
- **Tailwind CSS v4**, lucide-react icons, Noto Nastaliq Urdu + Geist fonts
- **Zustand** for all client state (no prop drilling, see `AGENTS.md`)
- **Zod v4** for every request body and every AI response
- **Drizzle ORM** + **postgres.js** on **Supabase Postgres** (used purely as a database; RLS enabled on all tables to close the Supabase Data API)
- **Better Auth** with the phone-number (OTP) plugin
- **OpenRouter** (free models) for all AI
- **Leaflet / react-leaflet** with OpenStreetMap tiles
- **Vercel** (functions pinned to `hnd1`, next to the Tokyo database pooler)

Our own backend lives in `src/app/api/**` (route handlers) and `src/server/**` (services, auth, AI).

```
src/
  app/            pages (thin) + api/ route handlers
  components/     ui/ primitives · worker/ · customer/ · job/ · auth/
  stores/         Zustand stores (session, login, voice, onboarding, worker dashboard, request, job thread, browse, toast)
  server/         db, auth, http helpers, ai/ (client + tasks), services/ (workers, jobs)
  lib/            trades, areas, phone, geo, numbers (spoken-number parser), validation, types, phrases
  db/schema.ts    Drizzle schema
scripts/          seed.ts (demo data) · smoke.mjs (end-to-end API test)
drizzle/          SQL migrations
```

## AI services used

| Service | Model(s) | Used for |
|---|---|---|
| OpenRouter | `nvidia/nemotron-3.5-super-vl:free` (primary), `google/gemma-4-31b-it:free`, `openrouter/free` (fallback chain) | Worker profile extraction, problem triage (text + **photo**), message translation + price detection, review summaries |
| OpenRouter | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | Server-side speech-to-text, only when the browser has no speech recognition (e.g. Firefox) |
| Browser Web Speech API | device/browser engine (`ur-PK`, `en-US`) | Live speech-to-text (free & unlimited) |
| Browser speechSynthesis | device voices (Urdu, else Hindi) | Read-aloud of prompts, profiles, job summaries and messages |

**Quota-aware design.** The provided OpenRouter key is free-tier (**50 free-model requests/day**). All AI goes through `src/server/ai/client.ts`, which:
caches results by input hash in the `ai_calls` table · tries the next model on upstream 429/5xx · stops calling for 10 minutes after the daily quota is hit · validates output with Zod (and discards "Urdu" fields that come back in Roman script) · never throws — each task has a deterministic fallback (keyword trade classifier, Urdu/Roman-Urdu spoken-number parser, area matcher, template review summary). The UI labels every AI-derived item honestly: **AI**, **Basic (AI offline)** or **Seeded**. Adding $10 of OpenRouter credit raises the free-model limit to 1,000/day.

## What is seeded, simulated or mocked

- **Seeded** (`npm run db:seed`, flagged `is_seeded`): 34 workers across 27 Islamabad/Rawalpindi areas, 10 review-author customers, ~170 completed past jobs with reviews, 2 workers currently engaged on a booked job (to show "busy"), the demo customer **Ayesha (0300 1111111)** and demo worker **Muhammad Aslam (0300 2222222)**. Seeded workers' trust summaries are template-generated (labelled *Seeded*); they switch to AI summaries after a new real review.
- **Simulated SMS**: there is no SMS gateway. Better Auth's `sendOTP` writes the code to an `sms_outbox` table and the UI shows it in an on-screen "SMS" banner and auto-fills it (like Android SMS autofill). `GET /api/sms/outbox` exposes codes **for demo only** — set `DEMO_SMS_INBOX=false` once a real provider is wired in.
- **Seeded workers are always "online"**; their GPS positions are jittered around sector centroids.
- **Not implemented (out of scope)**: payments, CNIC/identity verification, push notifications (the worker dashboard polls every 4 s and plays a chime).

## Running locally

Requirements: Node 20+ (tested on Node 24), npm.

```bash
npm install
cp .env.example .env.local     # fill in values
npm run db:migrate             # creates tables + enables RLS
npm run db:seed                # demo data (takes a few minutes over a high-latency link)
npm run dev                    # http://localhost:3000
node scripts/smoke.mjs         # optional: full two-sided API test against the running server
```

Environment variables (`.env.example`):

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Supabase **transaction** pooler (port 6543) — used by the app (`prepare: false`) |
| `DIRECT_URL` | Supabase **session** pooler (port 5432) — used by migrations and the seed |
| `OPENROUTER_API_KEY` | OpenRouter key |
| `BETTER_AUTH_SECRET` | random 32+ byte secret |
| `BETTER_AUTH_URL` | public base URL (on Vercel it falls back to the production URL) |
| `DEMO_SMS_INBOX` | optional; `false` disables the simulated SMS inbox |

**Demo tip:** open the customer in one browser and the worker in another (or an incognito window) to watch requests, voice notes, price cards and booking update live on both sides. Voice input needs Chrome/Edge/Safari and microphone permission (HTTPS or localhost).

## Known limitations

- Free OpenRouter models are rate-limited upstream and capped at 50 requests/day on this key; when exhausted, features degrade to the labelled rule-based fallbacks.
- Speech recognition quality depends on the browser's Urdu engine; Punjabi/Pashto speakers are only partially supported (the LLM is told to interpret charitably).
- Text-to-speech depends on installed device voices. Without an Urdu voice we use a Hindi voice with hand-written Devanagari prompts (dynamic text is transliterated approximately).
- Availability is "right now" (online + not engaged). Scheduling for a later time slot is not modelled.
- Real-time updates are polling-based (3–5 s), not websockets.
- Media (voice notes, photos) is stored in Postgres `bytea` (max 3 MB each) to avoid a separate storage service; URLs are unguessable UUIDs but not otherwise access-controlled.
- Location is snapped to the nearest known sector when GPS is outside Islamabad/Rawalpindi.

## AI coding assistant disclosure

This project was built with **Claude Code (Anthropic, Claude Opus 5.5)** as an AI pair-programmer, at the team's direction, during the hacking window.

## Credits

Next.js, React, Tailwind CSS, Drizzle ORM, postgres.js, Better Auth, Zod, Zustand, Leaflet, react-leaflet, lucide-react (all MIT/ISC/BSD-licensed open source). Map data © OpenStreetMap contributors. Fonts: Noto Nastaliq Urdu (SIL OFL), Geist (SIL OFL). AI via OpenRouter.
