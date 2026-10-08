import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import { Avatar, Stars } from "@/components/ui";
import AddonCard from "@/components/AddonCard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  if (!user) redirect("/login?next=/provider/dashboard");
  const { data: p } = await supabase.from("providers").select("*").eq("owner_id", user.id).maybeSingle();
  if (!p) return <div className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="text-2xl font-semibold">No provider profile</h1><p className="mt-2 text-ink-soft">This account isn't a provider.</p><Link className="btn-primary mt-6" href="/provider/signup">List your business</Link></div>;
  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const [{ data: events }, { data: stat }, { data: interest }] = await Promise.all([
    supabase.from("provider_events").select("type,created_at").eq("provider_id", p.id).gte("created_at", since),
    supabase.from("provider_stats").select("*").eq("provider_id", p.id).maybeSingle(),
    supabase.from("addon_interest").select("addon").eq("user_id", user.id),
  ]);
  const count = (t: string) => (events ?? []).filter((e: any) => e.type === t).length;
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * 86400000); return d.toISOString().slice(0, 10); });
  const byDay = days.map((d) => (events ?? []).filter((e: any) => e.type === "view" && e.created_at.slice(0, 10) === d).length);
  const max = Math.max(1, ...byDay);
  const imp = count("impression"), views = count("view"), contacts = count("contact");
  const have = new Set((interest ?? []).map((i: any) => i.addon));
  const kpis = [["Search appearances", imp], ["Profile views", views], ["Contact clicks", contacts], ["Conversion", imp ? `${Math.round((contacts / imp) * 100)}%` : "–"]];
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[14px] text-ink-soft">Dashboard</p><h1 className="text-4xl font-semibold tracking-tight">{p.company}</h1></div>
        <Link href={`/providers/${p.id}`} className="btn-ghost">View public profile</Link>
      </div>
      <p className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Last 14 days</p>
      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(([l, v]) => <div key={l as string} className="card p-5"><div className="text-[13px] text-ink-soft">{l}</div><div className="mt-1 text-4xl font-semibold tracking-tight">{v}</div></div>)}
      </div>
      <div className="card mt-4 p-6">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Profile views per day</h2>
          <div className="flex items-center gap-2 text-[14px]">{stat ? <><Stars value={Number(stat.avg_rating)} /> {Number(stat.avg_rating).toFixed(1)} · {stat.n} reviews</> : "No reviews yet"}</div></div>
        <div className="mt-5 flex h-32 items-end gap-1.5">
          {byDay.map((v, i) => <div key={i} className="flex-1 rounded-t-md bg-kiwi-500/80" style={{ height: `${Math.max(4, (v / max) * 100)}%` }} title={`${days[i]}: ${v}`} />)}
        </div>
      </div>
      <h2 className="mb-4 mt-12 text-2xl font-semibold tracking-tight">Add-ons</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AddonCard id="scheduling" emoji="📅" title="Scheduling" desc="Let customers book slots directly." initial={have.has("scheduling")} />
        <AddonCard id="invoicing" emoji="🧾" title="Invoicing" desc="Send professional invoices in a tap." initial={have.has("invoicing")} />
        <AddonCard id="payments" emoji="💳" title="Payments" desc="Get paid securely through Kiwi." initial={have.has("payments")} />
        <AddonCard id="backoffice" emoji="🗂️" title="Back-office" desc="Contracts, taxes and admin handled." initial={have.has("backoffice")} />
      </div>
    </div>
  );
}
