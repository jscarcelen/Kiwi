"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/track";
import UpgradeModal from "./UpgradeModal";

export type Saved = { id: string; name: string; qs: string };

export default function SavedFilters({ signedIn, hasPremium, paid, startLabel, qs, defaultName, saved }: { signedIn: boolean; hasPremium: boolean; paid: boolean; startLabel: string; qs: string; defaultName: string; saved: Saved[] }) {
  const router = useRouter();
  const [lock, setLock] = useState(false);
  const [msg, setMsg] = useState("");
  const save = async () => {
    if (!signedIn) return router.push(`/login?next=${encodeURIComponent("/search?" + qs)}`);
    if (!hasPremium) return setLock(true);
    const name = prompt("Name this filter", defaultName);
    if (!name) return;
    const { data, error } = await createClient().rpc("save_filter", { fname: name, fqs: qs });
    if (error) return setMsg(error.message);
    if (data?.premium) return setLock(true);
    track("premium_feature", { feature: "saved_filter", free: !paid });
    setMsg("Saved ✓"); router.refresh();
  };
  const remove = async (id: string) => { await createClient().from("saved_filters").delete().eq("id", id); router.refresh(); };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
      <button onClick={save} className="rounded-full bg-black/5 px-3.5 py-1.5 font-medium hover:bg-black/10">🔖 Save this search {!hasPremium && <span className="ml-1 rounded bg-navy px-1.5 py-0.5 text-[10px] text-white">PREMIUM</span>}</button>
      {msg && <span className="text-ink-soft">{msg}</span>}
      {saved.map((f) => <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-brand-50 pl-3.5 pr-2 py-1.5 text-brand-700"><Link href={`/search?${f.qs}`} className="font-medium hover:underline">{f.name}</Link><button aria-label={`Delete ${f.name}`} onClick={() => remove(f.id)} className="px-1 text-brand-700/60 hover:text-red-600">✕</button></span>)}
      <UpgradeModal open={lock} onClose={() => setLock(false)} feature="saved filters" startLabel={startLabel} />
    </div>
  );
}
