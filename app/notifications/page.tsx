import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import MarkRead from "@/components/MarkRead";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Alerts — WOM" };

const ago = (iso: string) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
};

export default async function Notifications() {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  if (!user) redirect("/login?next=/notifications");
  const { data } = await supabase.from("notifications").select("id,title,body,url,created_at,read_at").order("created_at", { ascending: false }).limit(50);
  const rows = data ?? [];
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-5">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Alerts</h1>
      <p className="mb-6 mt-1 text-ink-soft">What your friends and communities are up to.</p>
      {rows.length === 0 ? (
        <div className="card p-8 text-center"><div className="text-4xl">🔔</div><p className="mt-2 font-semibold">Nothing yet</p><p className="mt-1 text-[14px] text-ink-soft">When friends review a pro or someone joins your community, you'll see it here.</p><Link href="/network" className="btn-primary mt-5 inline-flex">Grow my network</Link></div>
      ) : (
        <ul className="card divide-y divide-black/5 overflow-hidden">
          {rows.map((n: any) => {
            const inner = (
              <div className={`flex gap-3 px-4 py-3.5 ${n.read_at ? "" : "bg-brand-50/60"}`}>
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-brand-600"}`} />
                <span className="min-w-0 flex-1"><span className="block font-semibold">{n.title}</span><span className="block text-[14px] text-ink-soft">{n.body}</span></span>
                <span className="shrink-0 text-[12px] text-ink-faint">{ago(n.created_at)}</span>
              </div>
            );
            return <li key={n.id}>{n.url ? <Link href={n.url} className="block hover:bg-black/[0.02]">{inner}</Link> : inner}</li>;
          })}
        </ul>
      )}
      <MarkRead />
    </div>
  );
}
