"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { catEmoji } from "@/lib/categories";
import { canShareNatively, shareNative } from "@/lib/native";

type Row = { id: string; company: string; category: string; city: string; unclaimed: boolean; token: string | null; ratings: number };
export default function MyAddedPros({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  if (!rows.length) return null;
  const link = (t: string) => `${origin}/claim/${t}`;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">Pros you've added</h2>
      <ul className="card mt-3 divide-y divide-black/5 px-5">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[14px]">
            <span><Link href={`/providers/${r.id}`} className="font-semibold hover:underline">{catEmoji(r.category)} {r.company}</Link><br /><span className="text-ink-faint">{r.city} · {r.ratings} rating{r.ratings === 1 ? "" : "s"} · {r.unclaimed ? "not claimed yet" : "claimed ✓"}</span></span>
            {r.unclaimed && r.token && (
              <span className="flex gap-3">
                <button className="text-brand-700 hover:underline" onClick={async () => { const msg = `I recommended you on WOM — claim your free profile: ${link(r.token!)}`; if (canShareNatively()) await shareNative({ text: msg, url: link(r.token!) }); else { await navigator.clipboard.writeText(msg); alert("Claim link copied."); } }}>Invite to claim</button>
                <button className="text-ink-faint hover:text-red-600" onClick={async () => { if (!confirm(`Remove ${r.company}?`)) return; await createClient().rpc("unclaim_remove", { pid: r.id }); router.refresh(); }}>Remove</button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
