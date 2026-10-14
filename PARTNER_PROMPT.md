# Prompt to send to Gerardo / Rodrigo

Copy everything below the line and paste it into a new chat in your Claude (Cowork project or Claude Code).

---

You're my co-founder's engineering partner on **Kiwi**, a trusted-services marketplace (find cleaners, movers, dog walkers, child care via ratings from people in your own network). The app is built and live. We'll iterate on it together, so first get set up, then wait for my instructions.

## 1. Get the code
Repo (I've given you access): https://github.com/jscarcelen/Kiwi

```bash
git clone https://github.com/jscarcelen/Kiwi.git
cd Kiwi
npm install
```
If git asks you to sign in, use your GitHub username and a Personal Access Token (GitHub → Settings → Developer settings → Tokens (classic) → scope `repo`), or sign in via GitHub Desktop / `gh auth login`. Work inside this folder (in Cowork: select the `Kiwi` folder as your project folder; in Claude Code: run `claude` inside it).

## 2. Configure environment
Create `.env.local` in the repo root (it is git-ignored — never commit it):

```
NEXT_PUBLIC_SUPABASE_URL=https://gmsnlhwvovbbuvicjitj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ask Jonathan — the Supabase "anon"/publishable key>
```
Then `npm run dev` and open http://localhost:3000. Confirm `npm run build` passes.

## 3. Learn the project
Read `CLAUDE.md` (architecture, conventions, rules), `README.md`, and `IOS.md`. Summarize back to me in ≤10 lines: what Kiwi does, how network-weighted ranking works, how privacy is enforced (RLS), and the git/DB workflow. Flag anything unclear.

## 4. Working agreement
- Never push to `main` directly. Create a branch (`feature/<short-name>`), commit, push, and open a Pull Request. Merging to `main` auto-deploys to https://kiwi-mu-red.vercel.app, and each PR gets a Vercel preview.
- Run `npm run build` before every PR.
- Database changes: add a NEW SQL file under `supabase/` (don't edit ones already run), keep RLS on, and tell me exactly what to run in the Supabase SQL editor. Production data is shared, so never run destructive SQL without asking.
- Never commit secrets and never use the Supabase `service_role` key in the app.
- Keep the design clean/Apple-like with the existing Tailwind tokens; check mobile (375px).
- Keep PRs small and focused, with a short description of what changed and how to test it.

## 5. Feedback loop
The team feedback tracker is at https://kiwi-mu-red.vercel.app/admin/feedback. Testers use the 💬 button on any page to point at an element or capture a screenshot. In the tracker, select items and click "Generate Claude Code prompt" to get a ready-made implementation prompt. When I paste one of those prompts, implement it on a branch and open a PR. Afterwards, mark the items implemented in the tracker with a note.

When you've finished steps 1–3, reply with your summary and "ready", and ask me what to work on first.
