# Moving WOM to new GitHub / Vercel / Supabase accounts

Nothing in the code is tied to the current accounts except three values: the Supabase URL + keys, the Vercel domain (`capacitor.config.ts`, `.env`) and the GitHub remote. Do it in this order. I (Claude) can't sign in to your accounts, so the clicks are yours; I've listed exactly what to do.

## 1. GitHub (5 min)
1. In the new account create an empty repo (no README).
2. In the project folder: `git remote set-url origin https://github.com/NEW-OWNER/NEW-REPO.git && git push -u origin main`
3. Add your partner as a collaborator (Settings → Collaborators).

## 2. Supabase (30–45 min — the one with data)
1. New account → New project. Note the **Project URL**, **anon key**, **service_role key** (Settings → API).
2. **Schema:** SQL editor → run the files in this order: `schema, seed (skip if launching real), feedback, feedback_open_access, phone, account_deletion, intake, verticals, referrals, communities, settings, admin, moderation, push, premium, recommend_pro, cities_universities`.
3. **Existing users/data (only if you have real ones):** old project → Database → Backups, or `pg_dump` with the connection string (Settings → Database) and restore into the new project. Auth users move with the `auth` schema dump; passwords keep working, phone/SMS settings do not.
4. Re-do dashboard settings: Auth → Providers (email, phone + SMS provider), URL configuration (Site URL = your new domain; add `https://YOUR-DOMAIN/**` to redirect URLs), email templates, Storage bucket `provider-photos` (created by schema.sql).
5. Make yourself admin: `insert into admins (user_id) select id from auth.users where email = 'YOU@EMAIL' on conflict do nothing;`

## 3. Vercel (10 min)
1. New account → Add New Project → import the repo from step 1 (framework: Next.js).
2. Environment variables (Settings → Environment Variables):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, and later `SUPABASE_SERVICE_ROLE_KEY`, `PUSH_SECRET`, `APNS_*`, `NEXT_PUBLIC_PADDLE_CHECKOUT_URL`.
3. Deploy; note the new URL (or attach your custom domain).
4. Remember Vercel Hobby is non-commercial — use Pro before charging anyone.

## 4. Update the references
- `capacitor.config.ts` → `server.url` = new domain; `capacitor-www/offline.html` → same URL.
- `.env.example` / README links; QR codes in `brand/` if they embed the old URL (regenerate from the new domain).
- Supabase Auth → URL configuration (step 2.4).
- Push: pg_cron job URL in `push.sql`.

## 5. Check
Sign up, sign in, add a friend, leave a review, open /admin, submit feedback, upload a photo. Then delete the old projects.

Tip: buy a custom domain first and point it at Vercel — then future moves only change DNS, not links people already shared.
