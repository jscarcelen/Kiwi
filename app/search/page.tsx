import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCircle, getViewer, rankProviders } from "@/lib/data";
import { catLabel } from "@/lib/categories";
import SearchBar from "@/components/SearchBar";
import { Empty, ProviderCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: { service?: string; city?: string; circle?: string } }) {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  const groups = user ? (await getCircle(supabase, user.id)).groups : [];
  const f = { service: searchParams.service ?? "all", city: searchParams.city ?? "Chicago", circle: searchParams.circle ?? "all" };
  const results = await rankProviders(supabase, user?.id ?? null, f);
  // log impressions for provider analytics (best effort)
  if (results.length) {
    await supabase.from("provider_events").insert(results.slice(0, 12).map((r) => ({ provider_id: r.provider.id, type: "impression", user_id: user?.id ?? null })));
  }
  const inNet = results.filter((r) => r.net);
  const rest = results.filter((r) => !r.net);
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <SearchBar initial={f} signedIn={!!user} groups={groups} />
      <div className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight">{f.service === "all" ? "All services" : catLabel(f.service)} in {f.city}</h1>
        <p className="mt-1 text-ink-soft">{results.length} providers</p>
      </div>
      {!user && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl bg-amber-50 p-5 sm:flex-row sm:items-center">
          <p className="text-[15px] text-amber-900"><b>You're seeing global ratings.</b> Sign in to narrow results to what your friends and groups recommend.</p>
          <Link href="/login?next=/search" className="btn-dark shrink-0 !py-2">Sign in</Link>
        </div>
      )}
      {user && inNet.length === 0 && results.length > 0 && (
        <div className="mt-6 rounded-2xl bg-kiwi-50 p-5 text-[15px] text-kiwi-700">
          No one in your circle has rated these yet. <Link href="/network" className="font-semibold underline">Add friends or join a group</Link> to unlock recommendations.
        </div>
      )}
      {inNet.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Recommended by your network</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{inNet.map((r) => <ProviderCard key={r.provider.id} r={r} signedIn />)}</div>
        </section>
      )}
      {rest.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">{user ? "More providers" : "Top rated"}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rest.map((r) => <ProviderCard key={r.provider.id} r={r} signedIn={!!user} />)}</div>
        </section>
      )}
      {results.length === 0 && <div className="mt-10"><Empty title="No providers found">Try another service or city.</Empty></div>}
    </div>
  );
}
