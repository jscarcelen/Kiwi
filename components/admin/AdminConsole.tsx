"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { Bars, Card, Empty, HBars, Stat } from "./charts";
import UsersTab from "./UsersTab";
import ContentTab from "./ContentTab";
import EditorTab from "./EditorTab";

const TABS = ["Overview", "Users", "Content", "Editor"] as const;
const catLabel = (s: string) => CATEGORIES.find((c) => c.slug === s)?.label ?? s;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export default function AdminConsole({ me }: { me: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-semibold tracking-tight">Admin console</h1><p className="text-[14px] text-ink-soft">Master account · stats, moderation and app editor</p></div>
        <Link href="/admin/feedback" className="btn-ghost">Feedback tracker →</Link>
      </div>
      <div className="mt-6 flex gap-1 overflow-x-auto rounded-full bg-black/5 p-1 text-[14px] font-medium">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 ${tab === t ? "bg-white shadow-sm" : "text-ink-soft"}`}>{t}</button>)}
      </div>
      <div className="mt-6">
        {tab === "Overview" && <Overview />}
        {tab === "Users" && <UsersTab me={me} />}
        {tab === "Content" && <ContentTab />}
        {tab === "Editor" && <EditorTab />}
      </div>
    </div>
  );
}

function Overview() {
  const [days, setDays] = useState(60);
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    setErr(""); setD(null);
    const { data, error } = await createClient().rpc("admin_overview", { days });
    if (error) setErr(error.message.includes("function") ? "Run supabase/admin.sql in the Supabase SQL editor first." : error.message); else setD(data);
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const insights = useMemo(() => (d ? buildInsights(d) : []), [d]);
  if (err) return <p className="rounded-2xl bg-red-50 p-4 text-[14px] text-red-700">{err}</p>;
  if (!d) return <p className="text-ink-soft">Loading…</p>;
  const t = d.totals, f = d.funnel, s = d.sessions, ins = d.installs, pr = d.premium, cm = d.communities;
  const signups = d.signups.map((x: any) => ({ label: x.d.slice(5), n: x.n }));
  const newInRange = d.signups.reduce((a: number, x: any) => a + x.n, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2 text-[13px]">
        <span className="text-ink-soft">Range</span>
        {[7, 30, 60, 90].map((n) => <button key={n} onClick={() => setDays(n)} className={`rounded-full px-3 py-1 ${days === n ? "bg-navy text-white" : "bg-black/5"}`}>{n}d</button>)}
      </div>

      <Card title="What's going well · what isn't · what to improve" sub="Auto-generated from the numbers below">
        <div className="grid gap-3 md:grid-cols-3">
          {(["good", "bad", "todo"] as const).map((k) => (
            <div key={k} className={`rounded-xl p-4 text-[13.5px] ${k === "good" ? "bg-green-50 text-green-900" : k === "bad" ? "bg-red-50 text-red-900" : "bg-brand-50 text-brand-700"}`}>
              <div className="mb-1 font-semibold">{k === "good" ? "Going well" : k === "bad" ? "Not working" : "Improve next"}</div>
              {insights.filter((i) => i.k === k).length ? <ul className="list-disc space-y-1.5 pl-4">{insights.filter((i) => i.k === k).map((i, n) => <li key={n}>{i.t}</li>)}</ul> : <p className="opacity-70">Nothing flagged yet.</p>}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Stat label="Users" value={t.users} hint={`+${newInRange} in ${days}d`} />
        <Stat label="Customers" value={t.customers} />
        <Stat label="Suppliers" value={t.suppliers} hint={`${t.listings} listings`} />
        <Stat label="Reviews" value={t.reviews} />
        <Stat label="Friend links" value={t.connections} />
        <Stat label="Communities" value={t.communities} hint={`${cm.owners} ambassadors`} />
        <Stat label="Referrals" value={t.referrals} hint={`${t.credits} credits earned`} />
        <Stat label="Requests sent" value={t.requests} />
        <Stat label="Premium users" value={t.premium} />
        <Stat label="Blocked" value={t.blocked} />
        <Stat label="Avg session" value={`${s.avg_min} min`} hint={`median ${s.median_min} · ${s.count} sessions`} />
        <Stat label="App installs" value={ins.pwa + ins.native} hint={`${ins.pwa} PWA · ${ins.native} iOS/Android`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`New accounts per day (last ${days}d)`}><Bars data={signups} /></Card>
        <Card title="Daily active (last 30d)" sub="Distinct signed-in users + anonymous sessions"><Bars data={d.active.map((x: any) => ({ label: x.d.slice(5), n: x.n }))} color="#5AA9FF" /></Card>
        <Card title="Time in app" sub={`Session length distribution · avg ${s.avg_min} min`}><Bars data={s.bins} height={110} /><div className="mt-1 flex justify-between text-[11px] text-ink-faint">{s.bins.map((b: any) => <span key={b.label}>{b.label}</span>)}</div></Card>
        <Card title="App downloads / installs" sub={`${ins.standalone_opens} PWA opens · ${ins.native_opens} native opens`}><Bars data={ins.by_day.map((x: any) => ({ label: x.d.slice(5), n: x.n }))} color="#051C2C" /></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Top supplier types" sub="Listings, with avg rating, reviews, profile views & contacts"><HBars rows={d.categories.map((c: any) => ({ label: catLabel(c.category), n: c.providers, note: `★${c.avg_rating ?? "–"} · ${c.reviews} rev · ${c.views} views · ${c.contacts} contacts` }))} /></Card>
        <Card title="Demand: project requests by type"><HBars rows={d.requests.map((r: any) => ({ label: catLabel(r.category), n: r.n }))} color="#5AA9FF" /></Card>
        <Card title="User archetypes (clusters)" sub="Rule-based segments from behaviour">
          <HBars rows={d.archetypes.map((a: any) => ({ label: a.name, n: a.n, note: `${a.friends} friends · ${a.reviews} rev avg` }))} />
          <p className="mt-3 text-[12px] text-ink-faint">Ambassador = owns a community · Connector = 5+ friends or 2+ referrals · Endorser = 2+ reviews · Explorer = 2+ searches · Dormant = no activity in 14 days.</p>
        </Card>
        <Card title="Customer funnel" sub="Share of customers who reach each step">
          <HBars suffix="" rows={[["Signed up", f.signups], ["Added friends", f.friends], ["Searched", f.searched], ["Left a review", f.reviewed], ["In a community", f.community], ["Referred someone", f.referred]].map(([label, n]: any) => ({ label, n, note: `${pct(n, f.signups)}%` }))} color="#2251FF" />
        </Card>
        <Card title="Top performers (rating × log reviews)" sub="Histogram of ratings and review counts per supplier">
          <div className="grid gap-5 sm:grid-cols-2">
            <div><div className="mb-2 text-[12px] font-medium text-ink-soft">Ratings given</div><Bars data={["1", "2", "3", "4", "5"].map((k) => ({ label: `${k}★`, n: Number(d.ratings[k]) }))} height={90} /><div className="mt-1 flex justify-between text-[11px] text-ink-faint">{["1★", "2★", "3★", "4★", "5★"].map((x) => <span key={x}>{x}</span>)}</div></div>
            <div><div className="mb-2 text-[12px] font-medium text-ink-soft">Reviews per supplier</div><Bars data={d.review_bins} height={90} color="#5AA9FF" /><div className="mt-1 flex justify-between text-[11px] text-ink-faint">{d.review_bins.map((b: any) => <span key={b.label}>{b.label}</span>)}</div></div>
          </div>
        </Card>
        <Card title="Top 10 suppliers">{d.top.length ? <div className="overflow-x-auto"><table className="w-full text-[13px]"><thead className="text-left text-ink-faint"><tr><th>Supplier</th><th>Type</th><th>★</th><th>Rev</th><th>Views</th><th>Contacts</th></tr></thead><tbody>{d.top.map((p: any) => <tr key={p.id} className="border-t border-black/5"><td className="py-1.5"><Link className="font-medium hover:underline" href={`/providers/${p.id}`}>{p.company}</Link></td><td>{catLabel(p.category)}</td><td>{p.avg}</td><td>{p.n}</td><td>{p.views}</td><td>{p.contacts}</td></tr>)}</tbody></table></div> : <Empty />}</Card>
        <Card title="Communities" sub={`${cm.communities} user-created · avg ${cm.avg_members} members`}><HBars rows={[...cm.official.map((o: any) => ({ label: `${o.name} (official)`, n: o.members })), ...cm.top.map((c: any) => ({ label: c.name, n: c.members, note: c.owner ? `by ${c.owner}` : "" }))]} color="#5AA9FF" /></Card>
        <Card title="Premium features: free vs paid" sub={`${pr.limit_hits} times users hit the free limit · ${pr.premium_users} premium users`}>
          {pr.by_feature.length ? <HBars rows={pr.by_feature.map((x: any) => ({ label: x.feature, n: x.uses, note: `${x.users} users · ${x.free} free / ${x.uses - x.free} paid` }))} /> : <Empty text="No premium-feature usage tracked yet" />}
        </Card>
        <Card title="Sign-in methods"><HBars rows={[{ label: "Email", n: d.methods.email_only }, { label: "Phone", n: d.methods.phone_only }, { label: "Both", n: d.methods.both }]} /></Card>
        <Card title="Search" sub={`${d.search.total ?? 0} searches · ${d.search.zero ?? 0} with zero results`}>{d.search.by_service?.length ? <HBars rows={d.search.by_service.map((x: any) => ({ label: x.service === "all" ? "All services" : catLabel(x.service), n: x.n, note: x.zero ? `${x.zero} empty` : "" }))} color="#051C2C" /> : <Empty />}</Card>
      </div>
    </div>
  );
}

function buildInsights(d: any) {
  const out: { k: "good" | "bad" | "todo"; t: string }[] = [];
  const t = d.totals, f = d.funnel, s = d.sessions, srch = d.search;
  const recent = d.signups.slice(-7).reduce((a: number, x: any) => a + x.n, 0), prev = d.signups.slice(-14, -7).reduce((a: number, x: any) => a + x.n, 0);
  if (recent > prev) out.push({ k: "good", t: `Signups up week over week (${recent} vs ${prev}).` });
  else if (prev > 0) out.push({ k: "bad", t: `Signups fell week over week (${recent} vs ${prev}).` });
  if (f.signups) {
    if (pct(f.friends, f.signups) >= 40) out.push({ k: "good", t: `${pct(f.friends, f.signups)}% of customers add friends — the network effect is working.` });
    else out.push({ k: "todo", t: `Only ${pct(f.friends, f.signups)}% of customers add friends. Push contact import / invites right after signup.` });
    if (pct(f.reviewed, f.signups) < 20) out.push({ k: "bad", t: `Just ${pct(f.reviewed, f.signups)}% have left a review; ratings are the product.` });
    if (f.referred && pct(f.referred, f.signups) >= 10) out.push({ k: "good", t: `${pct(f.referred, f.signups)}% of customers referred someone — referral credits are paying off.` });
  }
  const zeroCats = CATEGORIES.filter((c) => !d.categories.find((x: any) => x.category === c.slug && x.providers > 0));
  if (zeroCats.length) out.push({ k: "bad", t: `No suppliers in: ${zeroCats.map((c) => c.label).join(", ")}.` });
  const thin = d.categories.filter((c: any) => c.providers > 0 && c.reviews === 0);
  if (thin.length) out.push({ k: "todo", t: `No reviews yet for ${thin.map((c: any) => catLabel(c.category)).join(", ")} — seed with ambassadors.` });
  const topReq = d.requests[0], supply = (c: string) => d.categories.find((x: any) => x.category === c)?.providers ?? 0;
  if (topReq && supply(topReq.category) < 3) out.push({ k: "todo", t: `Most-requested type (${catLabel(topReq.category)}) has only ${supply(topReq.category)} suppliers — recruit more.` });
  if (srch.total >= 10 && pct(srch.zero, srch.total) > 25) out.push({ k: "bad", t: `${pct(srch.zero, srch.total)}% of searches return nothing — thin supply or filters too strict.` });
  if (s.count >= 5) { if (s.avg_min >= 3) out.push({ k: "good", t: `Avg session ${s.avg_min} min — people are engaging.` }); else out.push({ k: "bad", t: `Avg session only ${s.avg_min} min; most visits bounce.` }); }
  const dormant = d.archetypes.find((a: any) => a.name === "Dormant");
  if (dormant && t.customers && pct(dormant.n, t.customers) > 40) out.push({ k: "bad", t: `${pct(dormant.n, t.customers)}% of customers are dormant (14d inactive). Consider re-engagement messages.` });
  if (d.premium.limit_hits > 0) out.push({ k: "good", t: `${d.premium.limit_hits} users hit the free community limit — real demand for Premium.` });
  if (d.installs.pwa + d.installs.native === 0) out.push({ k: "todo", t: "No installs tracked. Prompt 'Add to Home Screen' and ship the iOS app." });
  if (t.suppliers && !t.reviews) out.push({ k: "todo", t: "Suppliers exist but no reviews: run a launch push to collect first ratings." });
  if (!out.length) out.push({ k: "todo", t: "Not enough data yet — insights appear as users arrive." });
  return out;
}
