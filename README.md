# 🥝 Kiwi — trusted-services marketplace

Next.js 14 (App Router) + Tailwind + Supabase (Auth, Postgres, Storage) · deploy on Vercel.

## Setup
1. Create a Supabase project. In **SQL Editor** run `supabase/schema.sql`, then `supabase/seed.sql` (demo data).
2. Auth → Providers → Email: turn **off** "Confirm email" for the MVP (or keep on and users must confirm first).
3. Copy `.env.example` → `.env.local` and fill in your Supabase URL + anon key.
4. `npm install && npm run dev`
5. Deploy: import the repo on Vercel and set the same two env vars.

## Notes
- Reviews are protected by Row Level Security: a user only sees review text from friends / group members who chose to share. Overall scores come from the `provider_stats` view.
- Group joining checks the account email domain (e.g. `chicagobooth.edu`). With "Confirm email" off this isn't verified — turn it on before a real launch.
- Instagram contact import is a stub (needs Meta app review); friends are added via search or invite link.
- "Plus" features are free during beta.
