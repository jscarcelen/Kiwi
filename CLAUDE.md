# WOM — project guide for Claude

WOM is a trusted-services marketplace: users find cleaners, movers/handymen, dog walkers, child care, tutors/coaches and beauty pros through ratings from people in their own network (friends, verified groups like Chicago Booth MBA), not anonymous reviews. Initial market: Chicago Booth community. Founders: Gerardo Sánchez, Rodrigo Peña, Jonathan Sanz.

- Live: https://kiwi-mu-red.vercel.app · Repo: https://github.com/jscarcelen/Kiwi
- Feedback tracker (team only, no login): /admin/feedback — collects in-app feedback (element + screenshot) and generates Claude Code prompts.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Auth, Postgres + RLS, Storage) · Vercel · PWA · Capacitor iOS wrapper (see IOS.md).

## Commands
`npm install` · `npm run dev` (http://localhost:3000) · `npm run build` (must pass before every PR).
Env (`.env.local`, never commit): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Optional server-only: `OPENAI_API_KEY` (feedback prompt refinement, model fixed to gpt-4o).

## Structure
- `app/` pages: `/` landing, `/search`, `/providers/[id]`, `/review/[id]`, `/login`, `/signup`, `/provider/signup`, `/provider/dashboard`, `/network`, `/help`, `/privacy`, `/admin/feedback`, `api/feedback/prompt`.
- `components/` UI + client forms (Nav, SearchBar, ProviderCard in ui.tsx, ReviewForm, NetworkManager, ContactsFinder, PhoneAuth, FeedbackWidget, FeedbackBoard…).
- `lib/data.ts` — `rankProviders()` network-weighted ranking (friends weight 1.0, group-only 0.6; network results first, then global). `lib/phone.ts` contact parsing. `lib/routeMap.ts` page→file map for feedback prompts. `lib/supabase/{server,client}.ts`.
- `supabase/*.sql` — run in this order: `schema.sql`, `seed.sql`, `feedback.sql`, `feedback_open_access.sql`, `phone.sql`, `account_deletion.sql`, `intake.sql`, `verticals.sql`, `referrals.sql`, `communities.sql`, `settings.sql`, `listings.sql`.

## Key concepts
- **Privacy by RLS:** review text is visible only to the author and to people in their circle (`in_my_circle()`), and only if `share_with_friends`. Global scores come from the `provider_stats` view (security definer). Never loosen these policies casually.
- **Groups** (`groups`, `group_members`) require an email domain match (`join_group()` RPC). Created on request.
- **Contacts matching:** phone numbers matched in `match_contacts()` RPC and never stored. Native iOS reads contacts via `@capacitor-community/contacts`.
- Demo seed data uses fictional users (ids `00000000-…-0000000000a1..a8`).

## Conventions
- Design: clean, Apple-like, navy + electric blue (`navy`, `brand-*` in tailwind.config.ts), rounded-3xl white cards, helper classes in `app/globals.css` (`.btn-primary`, `.btn-ghost`, `.card`, `.input`, `.label`). Mobile-first; check 375px.
- Prefer server components for data; client components only for interactivity. Keep changes minimal; no unrelated refactors.
- **DB changes:** add a NEW file in `supabase/` (never edit an already-run one silently), keep RLS on, and tell Jonathan exactly what to run in the Supabase SQL editor.
- **Secrets:** never commit keys. Never use or request the Supabase `service_role`/secret key or DB password in app code.
- UI copy in English.

## Git workflow
Work on a branch (`feature/<name>`), open a PR to `main`, Jonathan or Gerardo reviews/merges; merging to `main` auto-deploys to production on Vercel. Commit messages: short, imperative.

## Known TODOs / ideas
Report/block for reviews (App Store 1.2) · Instagram OAuth (needs Meta app review) · provider add-ons (scheduling, invoicing, payments, back-office are waitlist-only) · 2nd-degree ranking · password on /admin/feedback before wide launch · iOS app via Capacitor (IOS.md).

## Intake assistant & search UX (Oct 2026)
Landing hero + `components/IntakeModal.tsx`: user describes a need → `/api/intake` (gpt-4o, falls back to keyword rules) picks a category and pre-fills answers → remaining questions from `lib/intake.ts` (`QUESTIONS`) → `/search?service=…&a_<qid>=…`. Providers store `attributes` (jsonb keyed by the same question ids); filters exclude only providers that explicitly don't offer something. "Message top 3" saves a `project_requests` row visible to those providers on their dashboard.

## Communities & ambassadors
Members can create communities (`groups.owner_id` set; 3 free, more with `profiles.is_premium`), share `/c/<invite_code>` links and QR, and filter searches by a community (`circle=<slug>`). Joining via a signup link (`metadata.community`) is handled in `handle_new_user()` and earns the ambassador 1 credit (`referrals.kind='community'`); 5 credits = 1 free Premium month (banked). Official groups (`owner_id is null`, email-domain verified) are still listed publicly.

## Account menu, settings & tour
Top-right avatar menu (`components/UserMenu.tsx`) → My network & invites (invites live on `/network`), pro dashboard, Settings (`/settings`: profile + photo, email/password/phone, discoverability, pro profile, delete account), log out. The 1-minute product tour is `components/TourHost.tsx` (opens via `window.dispatchEvent(new CustomEvent("wom:tour"))`, auto-shows once after first login, buttons on the landing page).

## Several services per pro account
A pro account can have several listings (e.g. Cleaning and Dog walking): each is its own `providers` row (same `owner_id`, own category, name, description, regions, `attributes`, reviews) so it appears in its own searches. Shared contact details (contact name, phone, email) live on every row. Dashboard (`/provider/dashboard?listing=<id>`) has a tab per service; `/provider/service/new` and `/provider/service/[id]` (`components/ServiceForm.tsx`) add/edit/remove one; a provider page shows "Also offers" links. Never use `.eq("owner_id", …).maybeSingle()` on providers (it fails with several rows); pick by id or take the first by `created_at`. Needs `supabase/listings.sql` (owner delete policy) for removing a service.
