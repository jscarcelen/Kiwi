import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCircle, getViewer, rankProviders } from "@/lib/data";
import { CATEGORIES } from "@/lib/categories";
import SearchBar from "@/components/SearchBar";
import { ProviderCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  const groups = user ? (await getCircle(supabase, user.id)).groups : [];
  const top = await Promise.all(CATEGORIES.map((c) => rankProviders(supabase, user?.id ?? null, { service: c.slug, city: "Chicago", limit: 3 })));
  return (
    <>
      <section className="bg-gradient-to-b from-kiwi-50 via-white to-[#fbfbfd] px-5 pb-16 pt-20 text-center">
        <p className="text-[14px] font-semibold text-kiwi-700">Trusted by the people you trust</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">Find services your friends already love.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">Cleaners, movers, dog walkers and nannies — rated by people in your network, not anonymous strangers.</p>
        <div className="mt-10"><SearchBar signedIn={!!user} groups={groups} /></div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["1", "Connect your circle", "Invite friends or join a verified community like Chicago Booth MBA."],
            ["2", "See who they trust", "Every provider shows ratings from the people you know, front and center."],
            ["3", "Book with confidence", "Skip the guesswork. Rate your own experience to help your friends too."],
          ].map(([n, t, d]) => (
            <div key={n} className="card p-7">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-kiwi-100 text-[15px] font-semibold text-kiwi-700">{n}</div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{t}</h3>
              <p className="mt-1.5 text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
        {!user && (
          <div className="mt-8 rounded-3xl bg-ink p-8 text-center text-white sm:p-12">
            <h2 className="text-3xl font-semibold tracking-tight">New to Chicago? Borrow a trusted network.</h2>
            <p className="mx-auto mt-2 max-w-xl text-white/70">Join a verified group like Chicago Booth MBA and see ratings from people with the same standards — even if you don't know them yet.</p>
            <Link href="/signup" className="btn mt-6 bg-white text-ink hover:bg-white/90">Create your free account</Link>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <h2 className="text-3xl font-semibold tracking-tight">Top providers in Chicago</h2>
        <p className="mt-1 text-ink-soft">{user ? "Ranked by your network first." : "Global ratings. Sign in to see what your friends say."}</p>
        {CATEGORIES.map((c, i) => top[i].length > 0 && (
          <div key={c.slug} className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <h3 className="text-xl font-semibold tracking-tight">{c.emoji} {c.label}</h3>
              <Link href={`/search?service=${c.slug}&city=Chicago`} className="text-[14px] font-medium text-kiwi-700 hover:underline">See all →</Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{top[i].map((r) => <ProviderCard key={r.provider.id} r={r} signedIn={!!user} />)}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-5">
        <div className="card flex flex-col items-center justify-between gap-4 p-8 sm:flex-row">
          <div><h3 className="text-xl font-semibold">Run a service business?</h3><p className="text-ink-soft">Get discovered by customers whose friends already recommend you.</p></div>
          <Link href="/provider/signup" className="btn-primary">List your business</Link>
        </div>
      </section>
    </>
  );
}
