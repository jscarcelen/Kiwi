import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer, rankProviders } from "@/lib/data";
import { CATEGORIES } from "@/lib/categories";
import Hero from "@/components/Hero";
import IntakeButton from "@/components/IntakeButton";
import { ProviderCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  const [top, provCount, stats, groupCount] = await Promise.all([
    Promise.all(CATEGORIES.map((c) => rankProviders(supabase, user?.id ?? null, { service: c.slug, city: "Chicago", limit: 3 }))),
    supabase.from("providers").select("id", { count: "exact", head: true }),
    supabase.from("provider_stats").select("n"),
    supabase.from("groups").select("id", { count: "exact", head: true }),
  ]);
  const ratings = (stats.data ?? []).reduce((a: number, r: any) => a + (r.n ?? 0), 0);
  const heroStats = [
    { value: String(provCount.count ?? 0), label: "local pros" },
    { value: String(ratings), label: "ratings from the community" },
    { value: String(groupCount.count ?? 0), label: "verified groups" },
  ];
  return (
    <>
      <Hero stats={heroStats} />

      <section className="mx-auto max-w-6xl px-5 pt-16">
        <h2 className="text-3xl font-semibold tracking-tight">What do you need today?</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <IntakeButton key={c.slug} initialCategory={c.slug} className="card group p-6 text-left transition hover:-translate-y-0.5 hover:shadow-pop">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-kiwi-50 text-3xl">{c.emoji}</div>
              <div className="mt-4 text-lg font-semibold tracking-tight">{c.label}</div>
              <div className="mt-1 text-[14px] text-ink-soft">{c.blurb}</div>
            </IntakeButton>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-20">
        <h2 className="text-3xl font-semibold tracking-tight">How Kiwi works</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            ["Tell us what you need", "Describe it in your own words. Our assistant understands it and asks a few quick questions."],
            ["See who your friends trust", "Pros are ranked by ratings from people in your network and verified communities like Chicago Booth MBA."],
            ["Message your top matches", "Send your project to the best fits in one tap. No calls or texts until you reach out."],
          ].map(([t, d], i) => (
            <div key={t} className="card p-7"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-[15px] font-semibold text-white">{i + 1}</div><h3 className="mt-4 text-xl font-semibold tracking-tight">{t}</h3><p className="mt-1.5 text-ink-soft">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-20">
        <h2 className="text-3xl font-semibold tracking-tight">Top pros in Chicago</h2>
        <p className="mt-1 text-ink-soft">{user ? "Ranked by your network first." : "Overall ratings. Sign in to see what your friends say."}</p>
        {CATEGORIES.map((c, i) => top[i].length > 0 && (
          <div key={c.slug} className="mt-10">
            <div className="mb-4 flex items-end justify-between"><h3 className="text-xl font-semibold tracking-tight">{c.emoji} {c.label}</h3><Link href={`/search?service=${c.slug}&city=Chicago`} className="text-[14px] font-medium text-kiwi-700 hover:underline">See all →</Link></div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{top[i].map((r) => <ProviderCard key={r.provider.id} r={r} signedIn={!!user} />)}</div>
          </div>
        ))}
      </section>

      {!user && (
        <section className="mx-auto mt-20 max-w-6xl px-5">
          <div className="rounded-3xl bg-forest p-8 text-center text-white sm:p-12">
            <h2 className="text-3xl font-semibold tracking-tight">New to Chicago? Borrow a trusted network.</h2>
            <p className="mx-auto mt-2 max-w-xl text-white/75">Join a verified group like Chicago Booth MBA and see ratings from people with the same standards — even if you don't know them yet.</p>
            <Link href="/signup" className="btn-light mt-6">Create your free account</Link>
          </div>
        </section>
      )}
      <section className="mx-auto mt-10 max-w-6xl px-5">
        <div className="card flex flex-col items-center justify-between gap-4 p-8 sm:flex-row"><div><h3 className="text-xl font-semibold">Run a service business?</h3><p className="text-ink-soft">Get discovered by customers whose friends already recommend you.</p></div><Link href="/provider/signup" className="btn-primary">Join as a pro</Link></div>
      </section>
    </>
  );
}
