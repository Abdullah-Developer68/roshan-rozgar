<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules: Roshan Rozgar

### Stack (do not swap without discussion)
Next.js (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · Zod · Drizzle ORM · Supabase **as a Postgres database only** · Better Auth · Zustand · OpenRouter (free models) · Vercel. Use **npm** and **Node**.

- Supabase is only the database host. Do **not** add `@supabase/*` client libraries, Supabase Auth, Storage or Realtime. All backend logic lives in our own route handlers under `src/app/api/**` and services under `src/server/**`.
- All database access goes through Drizzle (`src/server/db`). Schema lives in `src/db/schema.ts`.
- Validate every request body and every AI response with Zod (`src/lib/validation.ts`, `src/server/ai/schemas.ts`).

### State management: Zustand, and **no prop drilling**
- **Prop drilling is not allowed.** If a value would have to pass through a component that does not use it itself, put it in a Zustand store under `src/stores/` and read it with a selector where it is needed.
- Shared/screen-level state (session, onboarding draft, search results, job thread, recorder state, toasts) lives in Zustand stores. Do not lift it into a parent and pass it down.
- Props are acceptable only for (a) generic UI primitives in `src/components/ui/` (e.g. `<BigButton onClick>`), and (b) a list rendering its own direct child item (`<WorkerCard worker={w} />`), where the child uses the prop itself and does not forward it further.
- Route params are read with `useParams()` inside the client screen, not passed down from `page.tsx`.
- Use selectors (`useStore((s) => s.x)`) rather than subscribing to the whole store.

### AI usage
- The OpenRouter key is free-tier (~50 free-model requests/day). Every AI call goes through `src/server/ai/client.ts`, which caches by input hash, logs to `ai_calls`, and falls back to a deterministic parser. Never call OpenRouter from the browser.
- UI must label AI vs fallback output honestly (the judges penalise mocked features presented as real).

### Design system (monochrome, editorial)
Tokens live in `src/app/globals.css`; components come from shadcn/ui (`src/components/ui`, style `radix-nova`, RTL enabled). Add new primitives with `npx shadcn@latest add <name>`.
- **Palette:** off-white canvas `background` (#f7f7f5), white `card`, near-black `foreground`/`primary`, `muted-foreground` for secondary text, `faint` for the second line of two-tone headings, `hairline`/`border` for 1px rules. No decorative colour.
- **Colour means something:** `ok` (available / confirm), `busy` (engaged), `off` (offline), `destructive` (decline/danger), amber only on the "AI offline" badge. Use these only for state.
- **Type:** Geist, medium weight, tight tracking. Display headings use `.display` (+ `.display-faint` for the grey second line); small caps labels use `.eyebrow`. Urdu uses Nastaliq via `.urdu` / the `lang-ur` screen class.
- **Shape:** `rounded-lg` controls, `rounded-xl` cards (`.surface`), hairline borders instead of rings, shadows only on floating layers.
- **Layout:** thin sticky header with hairline bottom border; sections separated by `.section-rule`; framed grids use `.frame` + hairline cell borders.
- **Buttons:** shadcn `<Button>` — `default` (black) for the primary action, `outline` for secondary, `success` for confirm/accept, size `touch` in the worker flow (low-literacy users need big targets and green/red cues; do not make the worker flow monochrome).
