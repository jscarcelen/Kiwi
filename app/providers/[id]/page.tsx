import Link from "next/link";
import ReportButton from "@/components/ReportButton";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCircle, getViewer } from "@/lib/data";
import { catEmoji, catLabel } from "@/lib/categories";
import { HEADINGS, QUESTIONS, labelFor } from "@/lib/intake";
import { Avatar, Stars } from "@/components/ui";
import ContactButton from "@/components/ContactButton";

export const dynamic = "force-dynamic";

export default async function ProviderPage({ params, searchParams }: { params: { id: string }; searchParams?: { rs?: string } }) {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  const { data: p } = await supabase.from("providers").select("*").eq("id", params.id).maybeSingle();
  if (!p) notFound();
  const { data: adderRow } = p.unclaimed && p.created_by ? await supabase.from("profiles").select("full_name").eq("id", p.created_by).maybeSingle() : { data: null as any };
  const adderFirst = (adderRow?.full_name ?? "your friend").split(" ")[0];
  const [{ data: stat }, { data: revs }, { data: siblings }] = await Promise.all([
    supabase.from("provider_stats").select("*").eq("provider_id", p.id).maybeSingle(),
    supabase.from("reviews").select("id,user_id,rating,comment,created_at,profiles(full_name)").eq("provider_id", p.id).order("created_at", { ascending: false }),
    p.owner_id ? supabase.from("providers").select("id,company,category").eq("owner_id", p.owner_id).neq("id", p.id).order("created_at") : Promise.resolve({ data: [] as any[] }),
  ]);
  if (!user || user.id !== p.owner_id) await supabase.from("provider_events").insert({ provider_id: p.id, type: "view", user_id: user?.id ?? null });
  const mine = (revs ?? []).find((r: any) => r.user_id === user?.id);
  const others = (revs ?? []).filter((r: any) => r.user_id !== user?.id);
  // "Whose ratings": all, my network (friends), or my communities (people who share one of them). Signed-in only.
  const rs = user && (searchParams?.rs === "network" || searchParams?.rs === "communities") ? searchParams.rs : "all";
  let friendIds = new Set<string>(); let communityIds = new Set<string>();
  if (user) {
    const circle = await getCircle(supabase, user.id);
    friendIds = circle.friendIds;
    const gids = circle.groups.map((g: any) => g.id).filter(Boolean);
    if (gids.length) { const { data: mem } = await supabase.from("group_members").select("user_id").in("group_id", gids).eq("visible", true); communityIds = new Set((mem ?? []).map((m: any) => m.user_id)); }
  }
  const network = rs === "network" ? others.filter((r: any) => friendIds.has(r.user_id)) : rs === "communities" ? others.filter((r: any) => communityIds.has(r.user_id)) : others;
  const scoped = rs !== "all";
  const scopedN = network.length;
  const scopedAvg = scopedN ? network.reduce((a: number, r: any) => a + r.rating, 0) / scopedN : null;
  const scopedCount = (star: number) => network.filter((r: any) => r.rating === star).length;
  const hidden = scoped ? 0 : Math.max(0, (stat?.n ?? 0) - (revs ?? []).length);
  const netAvg = network.length ? network.reduce((a: number, r: any) => a + r.rating, 0) / network.length : null;
  const attrs = p.attributes ?? {};
  const services = (QUESTIONS[p.category] ?? []).filter((q) => Array.isArray(attrs[q.id]) && attrs[q.id].length);
  const regions = [p.city, ...(p.regions ?? []).filter((r: string) => r !== p.city)];
  const tab = "border-b-2 border-transparent px-1 py-3 text-[15px] text-ink-soft hover:text-ink";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <nav className="text-[13px] text-ink-soft"><Link href="/" className="hover:underline">WOM</Link> › <Link href={`/search?service=${p.category}`} className="hover:underline">{catLabel(p.category)}</Link> › <span className="font-medium text-ink">{p.company}</span></nav>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="flex items-start gap-5">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-50 to-brand-200 text-5xl sm:h-36 sm:w-36">
              {p.photo_url ? <img src={p.photo_url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : catEmoji(p.category)}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{p.company}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[15px]">
                {stat ? <><span className="font-semibold text-brand-700">{Number(stat.avg_rating) >= 4.5 ? "Excellent" : "Great"} {Number(stat.avg_rating).toFixed(1)}</span><Stars value={Number(stat.avg_rating)} size={16} /><span className="text-ink-soft">({stat.n})</span></> : <span className="text-ink-soft">New on WOM</span>}
              </div>
              {network.length > 0 && <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[13px] font-medium text-brand-700">👥 {network.length} in your network · {netAvg!.toFixed(1)}★</p>}
            </div>
          </div>

          {p.unclaimed && (
            <div className="mt-4 rounded-2xl bg-brand-50 p-4 text-[14px] text-brand-700"><b>Recommended by {adderFirst}</b> · This pro isn't on WOM yet. {user?.id === p.created_by ? <>Invite them from <Link href="/add-pro" className="font-semibold underline">your added pros</Link>.</> : <>Profile created from a friend's recommendation.</>}</div>
          )}
          {(siblings ?? []).length > 0 && (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-[14px] text-ink-soft">Also offers:
              {(siblings ?? []).map((o: any) => <Link key={o.id} href={`/providers/${o.id}`} className="rounded-full bg-black/5 px-3 py-1 font-medium text-ink hover:bg-black/10">{catEmoji(o.category)} {catLabel(o.category)}</Link>)}
            </p>
          )}

          <div className="sticky top-16 z-30 mt-6 flex gap-6 border-b border-black/10 bg-[#fbfbfd]/95 backdrop-blur">
            <a href="#about" className={tab}>About</a><a href="#services" className={tab}>Services</a><a href="#reviews" className={tab}>Reviews</a>
          </div>

          <div className="mt-6 rounded-2xl bg-black/[0.04] p-5">
            <div className="flex items-center gap-2 font-semibold">✨ Why WOM recommends this pro</div>
            <ul className="mt-2 space-y-1 text-[14px] text-ink-soft">
              {!user ? <li>Sign in to see how people in your network rate them.</li> : network.length ? <li>{network.length} {network.length === 1 ? "person" : "people"} you know rated them {netAvg!.toFixed(1)}/5.</li> : <li>No one in your network has rated them yet — you could be the first.</li>}
              {stat && <li>{stat.n} overall rating{stat.n > 1 ? "s" : ""} averaging {Number(stat.avg_rating).toFixed(1)}/5.</li>}
              <li>Serves {regions.join(", ")}.</li>
            </ul>
          </div>

          <section id="about" className="scroll-mt-32 pt-10">
            <h2 className="text-2xl font-semibold tracking-tight">About</h2>
            <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">{p.description}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div><h3 className="font-semibold">Overview</h3><ul className="mt-2 space-y-1.5 text-[14px] text-ink-soft"><li>{catEmoji(p.category)} {catLabel(p.category)}</li><li>📍 Serves {regions.join(", ")}</li>{p.contact_name && <li>👤 {p.contact_name}</li>}</ul></div>
              <div><h3 className="font-semibold">Why people choose WOM pros</h3><ul className="mt-2 space-y-1.5 text-[14px] text-ink-soft"><li>✅ Rated by real customers</li><li>👥 Friends' reviews first</li><li>🔒 You choose when to share contact info</li></ul></div>
            </div>
          </section>

          {services.length > 0 && (
            <section id="services" className="scroll-mt-32 border-t border-black/10 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight">Services offered</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {services.map((q) => (
                  <div key={q.id}><h3 className="text-[14px] font-semibold">{HEADINGS[q.id]}</h3><ul className="mt-2 space-y-1">{attrs[q.id].map((v: string) => <li key={v} className="text-[14px] text-ink-soft"><span className="mr-2 text-brand-700">✓</span>{labelFor(p.category, q.id, v)}</li>)}</ul></div>
                ))}
              </div>
            </section>
          )}

          <section id="reviews" className="scroll-mt-32 border-t border-black/10 pt-10">
            <h2 className="text-2xl font-semibold tracking-tight">Reviews</h2>
            {user && (
              <div className="mt-4 inline-flex gap-1 rounded-full bg-black/5 p-1 text-[14px]" role="tablist" aria-label="Whose ratings">
                {([["all", "All ratings"], ["network", "My network"], ["communities", "Communities"]] as const).map(([id, label]) => (
                  <Link key={id} role="tab" aria-selected={rs === id} scroll={false} href={`/providers/${p.id}${id === "all" ? "" : `?rs=${id}`}#reviews`} className={`rounded-full px-4 py-1.5 font-semibold ${rs === id ? "bg-white shadow-sm" : "text-ink-soft hover:bg-black/5"}`}>{label}</Link>
                ))}
              </div>
            )}
            {(scoped ? scopedN > 0 : !!stat) && (
              <div className="mt-4 flex flex-wrap items-center gap-8">
                <div><div className="text-4xl font-semibold text-brand-700">{(scoped ? scopedAvg! : Number(stat.avg_rating)).toFixed(1)}</div><Stars value={scoped ? scopedAvg! : Number(stat.avg_rating)} size={20} /><div className="mt-1 text-[13px] text-ink-soft">{scoped ? scopedN : stat.n} {(scoped ? scopedN : stat.n) === 1 ? "review" : "reviews"}{scoped ? ` from ${rs === "network" ? "your network" : "your communities"}` : ""}</div></div>
                <div className="min-w-[220px] flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((s) => { const total = scoped ? scopedN : stat.n; const c = scoped ? scopedCount(s) : (stat[`c${s}`] ?? 0); const pct = total ? Math.round((c / total) * 100) : 0; return <div key={s} className="flex items-center gap-2 text-[13px]"><span className="w-6">{s} ★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${pct}%` }} /></div><span className="w-9 text-right text-ink-faint">{c}</span></div>; })}
                </div>
              </div>
            )}
            <h3 className="mb-3 mt-8 font-semibold">{rs === "network" ? "From your network" : rs === "communities" ? "From your communities" : "From people you know"}</h3>
            {!user ? (
              <div className="card p-6 text-ink-soft"><Link href={`/login?next=/providers/${p.id}`} className="font-semibold text-brand-700 underline">Sign in</Link> to see which friends and groups have used {p.company}.</div>
            ) : network.length === 0 ? (
              <div className="card p-6 text-ink-soft">{scoped ? `Nobody in ${rs === "network" ? "your network" : "your communities"} has reviewed this pro yet.` : "None of your contacts have reviewed this pro yet."}{hidden > 0 && ` ${hidden} other rating${hidden > 1 ? "s are" : " is"} included in the overall score.`}</div>
            ) : (
              <div className="space-y-3">
                {network.map((r: any) => (
                  <div key={r.id} className="card flex gap-4 p-5">
                    <Avatar id={r.user_id} name={(r.profiles as any)?.full_name ?? "?"} size={40} />
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b>{(r.profiles as any)?.full_name}</b><Stars value={r.rating} size={14} /><span className="text-[12px] text-ink-faint">{new Date(r.created_at).toLocaleDateString()}</span>{r.user_id !== user?.id && <ReportButton type="review" id={r.id} authorId={r.user_id} signedIn={!!user} className="ml-auto" />}</div>{r.comment && <p className="mt-1 text-ink-soft">{r.comment}</p>}</div>
                  </div>
                ))}
                {hidden > 0 && <p className="text-[13px] text-ink-faint">+ {hidden} anonymous rating{hidden > 1 ? "s" : ""} from outside your network.</p>}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-3 border-t-4 border-t-navy p-6">
            <ContactButton providerId={p.id} phone={p.phone} email={p.email} unclaimed={!!p.unclaimed} adder={adderFirst} />
            <Link href={user ? `/review/${p.id}` : `/login?next=/review/${p.id}`} className="btn-ghost w-full">{mine ? "Edit your review" : "I've used this pro"}</Link>
            {mine && <p className="text-center text-[13px] text-ink-soft">You rated {mine.rating}/5.</p>}
            <p className="text-center text-[13px] text-ink-faint">🟢 Contact details are shared only when you click.</p>
          </div>
          <div className="rounded-2xl bg-black/[0.04] p-5 text-[14px]"><div className="font-semibold">WOM network</div><p className="mt-1 text-ink-soft">Reviews from people you know — not anonymous strangers.</p></div>
          {p.owner_id !== user?.id && <div className="text-center"><ReportButton type="provider" id={p.id} authorId={p.created_by ?? p.owner_id} signedIn={!!user} label="Report this profile" /></div>}
          <div className="card p-5"><div className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Coming soon</div><ul className="mt-2 space-y-1.5 text-[14px] text-ink-soft"><li>📅 Book appointments</li><li>💳 Pay securely through WOM</li></ul></div>
        </aside>
      </div>
    </div>
  );
}
