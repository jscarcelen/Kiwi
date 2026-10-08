import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import { catEmoji, catLabel } from "@/lib/categories";
import { Avatar, Stars } from "@/components/ui";
import ContactButton from "@/components/ContactButton";

export const dynamic = "force-dynamic";

export default async function ProviderPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  const { data: p } = await supabase.from("providers").select("*").eq("id", params.id).maybeSingle();
  if (!p) notFound();
  const [{ data: stat }, { data: revs }] = await Promise.all([
    supabase.from("provider_stats").select("*").eq("provider_id", p.id).maybeSingle(),
    supabase.from("reviews").select("id,user_id,rating,comment,created_at,profiles(full_name)").eq("provider_id", p.id).order("created_at", { ascending: false }),
  ]);
  if (!user || user.id !== p.owner_id) await supabase.from("provider_events").insert({ provider_id: p.id, type: "view", user_id: user?.id ?? null });
  const mine = (revs ?? []).find((r: any) => r.user_id === user?.id);
  const network = (revs ?? []).filter((r: any) => r.user_id !== user?.id);
  const hidden = Math.max(0, (stat?.n ?? 0) - (revs ?? []).length);
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <Link href="/search" className="text-[14px] text-ink-soft hover:underline">← Back to results</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="card overflow-hidden">
            <div className="relative flex h-56 items-center justify-center bg-gradient-to-br from-kiwi-50 to-kiwi-200">
              {p.photo_url ? <img src={p.photo_url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="text-7xl">{catEmoji(p.category)}</span>}
            </div>
            <div className="p-7">
              <div className="text-[12px] font-medium uppercase tracking-wide text-ink-faint">{catLabel(p.category)}</div>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight">{p.company}</h1>
              <div className="mt-3 flex items-center gap-2">
                {stat ? <><Stars value={Number(stat.avg_rating)} size={18} /><span className="font-semibold">{Number(stat.avg_rating).toFixed(1)}</span><span className="text-ink-soft">· {stat.n} ratings</span></> : <span className="text-ink-soft">No ratings yet</span>}
              </div>
              <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">{p.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[p.city, ...(p.regions ?? []).filter((r: string) => r !== p.city)].map((r: string) => <span key={r} className="rounded-full bg-black/5 px-3 py-1 text-[13px]">{r}</span>)}
              </div>
            </div>
          </div>

          <h2 className="mb-4 mt-10 text-2xl font-semibold tracking-tight">From people you know</h2>
          {!user ? (
            <div className="card p-6 text-ink-soft">
              <Link href={`/login?next=/providers/${p.id}`} className="font-semibold text-kiwi-700 underline">Sign in</Link> to see which friends and groups have used {p.company}.
            </div>
          ) : network.length === 0 ? (
            <div className="card p-6 text-ink-soft">None of your contacts have reviewed this provider yet. {hidden > 0 && `${hidden} other rating${hidden > 1 ? "s are" : " is"} included in the overall score.`}</div>
          ) : (
            <div className="space-y-3">
              {network.map((r: any) => (
                <div key={r.id} className="card flex gap-4 p-5">
                  <Avatar id={r.user_id} name={(r.profiles as any)?.full_name ?? "?"} size={40} />
                  <div>
                    <div className="flex items-center gap-2"><b>{(r.profiles as any)?.full_name}</b><Stars value={r.rating} size={14} /></div>
                    {r.comment && <p className="mt-1 text-ink-soft">{r.comment}</p>}
                  </div>
                </div>
              ))}
              {hidden > 0 && <p className="text-[13px] text-ink-faint">+ {hidden} anonymous rating{hidden > 1 ? "s" : ""} from outside your network.</p>}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card space-y-3 p-6">
            <ContactButton providerId={p.id} phone={p.phone} email={p.email} />
            <Link href={user ? `/review/${p.id}` : `/login?next=/review/${p.id}`} className="btn-ghost w-full">{mine ? "Edit your review" : "I've used this provider"}</Link>
            {mine && <p className="text-center text-[13px] text-ink-soft">You rated {mine.rating}/5.</p>}
          </div>
          <div className="card p-6">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Coming soon</div>
            <ul className="mt-2 space-y-1.5 text-[14px] text-ink-soft"><li>📅 Book appointments</li><li>💳 Pay securely through Kiwi</li></ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
