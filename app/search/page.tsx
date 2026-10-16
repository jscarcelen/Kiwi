import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import SavedFilters from "@/components/SavedFilters";
import { fmtDate, getPremium } from "@/lib/premium";
import TrackEvent from "@/components/TrackEvent";
import { getCircle, getViewer, rankProviders } from "@/lib/data";
import { catLabel } from "@/lib/categories";
import { readAnswers, WHEN_LABEL } from "@/lib/intake";
import SearchBar from "@/components/SearchBar";
import SearchFilters from "@/components/SearchFilters";
import SendProject from "@/components/SendProject";
import IntakeButton from "@/components/IntakeButton";
import { Empty, ProviderRow } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  const groups = user ? (await getCircle(supabase, user.id)).groups : [];
  const service = searchParams.service ?? "all";
  const city = searchParams.city ?? "Chicago";
  const circle = searchParams.circle ?? "all";
  const answers = readAnswers(searchParams, service);
  const prem = await getPremium(supabase);
  const { data: savedRows } = user ? await supabase.from("saved_filters").select("id,name,qs").order("created_at", { ascending: false }).limit(12) : { data: [] as any[] };
  const qsNow = new URLSearchParams(Object.entries(searchParams).filter(([, v]) => typeof v === "string" && v) as [string, string][]).toString();
  const results = await rankProviders(supabase, user?.id ?? null, { service, city, circle, answers });
  if (results.length) await supabase.from("provider_events").insert(results.slice(0, 12).map((r) => ({ provider_id: r.provider.id, type: "impression", user_id: user?.id ?? null })));
  const inNet = results.filter((r) => r.net);
  const top3 = results.slice(0, 3).map((r) => ({ id: r.provider.id, company: r.provider.company }));
  const filters = <Suspense><SearchFilters service={service} answers={answers} /></Suspense>;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <SearchBar initial={{ service, city, circle }} signedIn={!!user} groups={groups} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside>
          <details className="lg:hidden"><summary className="btn-ghost w-full cursor-pointer list-none">Filters</summary><div className="mt-4">{filters}</div></details>
          <div className="hidden lg:block lg:sticky lg:top-24">{filters}</div>
        </aside>
        <section>
          <h1 className="text-3xl font-semibold tracking-tight">Matching {service === "all" ? "pros" : catLabel(service).toLowerCase()}</h1>
          <details className="mt-1 text-[14px] text-ink-soft"><summary className="cursor-pointer list-none">Our criteria ⓘ</summary><p className="mt-2 max-w-xl rounded-xl bg-black/[0.04] p-3">We rank pros your friends rate highest first (direct friends count fully, group members 60%), then everyone else by overall rating and number of reviews. Filters only exclude pros who told us they don't offer that service.</p></details>
          <SavedFilters signedIn={!!user} hasPremium={prem.has_premium} paid={prem.paid} startLabel={fmtDate(prem.start)} qs={qsNow} defaultName={service === "all" ? "All pros" : catLabel(service)} saved={(savedRows ?? []) as any[]} />
          {searchParams.q && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-black/[0.04] px-4 py-3 text-[14px]">
              <span><b>Your project:</b> {searchParams.q}{searchParams.when && ` · ${WHEN_LABEL[searchParams.when] ?? ""}`}</span>
              <IntakeButton className="font-medium text-brand-700 hover:underline" initialText={searchParams.q} city={city}>Edit</IntakeButton>
            </div>
          )}
          {service === "all" && <div className="mt-5 rounded-2xl bg-brand-50 p-5"><b>Not sure where to start?</b> <IntakeButton className="font-semibold text-brand-700 underline" city={city}>Tell our assistant what you need</IntakeButton></div>}
          {service !== "all" && <div className="mt-5"><SendProject top={top3} category={service} summary={searchParams.q ?? catLabel(service)} answers={answers} city={city} when={searchParams.when} /></div>}
          {!user && (
            <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl bg-amber-50 p-4 sm:flex-row sm:items-center">
              <p className="text-[14px] text-amber-900"><b>Global ratings shown.</b> Sign in to rank by what your friends and groups recommend.</p>
              <Link href={`/login?next=${encodeURIComponent("/search?service=" + service + "&city=" + city)}`} className="btn-primary shrink-0 !py-2">Sign in</Link>
            </div>
          )}
          {user && inNet.length === 0 && results.length > 0 && <div className="mt-4 rounded-2xl bg-brand-50 p-4 text-[14px] text-brand-700">No one in your circle has rated these yet. <Link href="/network" className="font-semibold underline">Add friends or join a group</Link>.</div>}
          <TrackEvent type="search" meta={{ service, city, circle, results: results.length }} />
          <div className="mt-6 space-y-4">{results.map((r) => <ProviderRow key={r.provider.id} r={r} />)}</div>
          {results.length === 0 && <div className="mt-8"><Empty title="No pros match those filters">Try removing a filter or choosing another city.</Empty></div>}
          <div className="mt-6 rounded-2xl bg-brand-50 p-5 text-[14px]"><b>Know a great {service === "all" ? "pro" : catLabel(service).toLowerCase()} who isn't listed?</b> <Link href={`/add-pro?service=${service === "all" ? "" : service}&city=${encodeURIComponent(city)}`} className="font-semibold text-brand-700 underline">Recommend them</Link> — your friends and communities will see it first.</div>
        </section>
      </div>
    </div>
  );
}
