"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./ui";

type P = { id: string; full_name: string; instagram?: string | null };
export default function NetworkManager({ me, friends, myGroups, allGroups, suggestions = [] }: { me: string; friends: P[]; myGroups: any[]; allGroups: any[]; suggestions?: any[] }) {
  const router = useRouter();
  const s = createClient();
  const [q, setQ] = useState(""); const [results, setResults] = useState<P[]>([]);
  const [msg, setMsg] = useState<Record<string, string>>({}); const [copied, setCopied] = useState(false);
  const friendIds = new Set(friends.map((f) => f.id));
  const refresh = () => router.refresh();
  const search = async (v: string) => {
    setQ(v);
    if (v.trim().length < 2) return setResults([]);
    const { data } = await s.from("profiles").select("id,full_name,instagram").or(`full_name.ilike.%${v.replace(/[%,]/g, "")}%,instagram.ilike.%${v.replace(/[%,@]/g, "")}%`).neq("id", me).eq("is_provider", false).limit(8);
    setResults(data ?? []);
  };
  const invite = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${me}` : "";
  const joined = new Set(myGroups.map((g) => g.id));
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight">Friends</h2>
        <div className="card mt-4 p-5">
          <label className="label">Find people on Kiwi</label>
          <input className="input" placeholder="Name or Instagram handle" value={q} onChange={(e) => search(e.target.value)} />
          <ul className="mt-3 divide-y divide-black/5">
            {results.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-3"><Avatar id={p.id} name={p.full_name} /> <span>{p.full_name}{p.instagram && <span className="ml-1 text-[13px] text-ink-faint">@{p.instagram}</span>}</span></span>
                {friendIds.has(p.id) ? <span className="text-[13px] text-ink-faint">Connected</span> : <button className="btn-ghost !py-1.5 !text-[14px]" onClick={async () => { await s.rpc("add_friend", { target: p.id }); setQ(""); setResults([]); refresh(); }}>Add</button>}
              </li>
            ))}
          </ul>
          <button className="btn-ghost mt-3 w-full" onClick={async () => { await navigator.clipboard.writeText(invite); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? "Link copied ✓" : "Copy my invite link"}</button>
          <p className="mt-2 text-[13px] text-ink-faint">Friends who sign up with your link are connected to you automatically.</p>
        </div>
        <ul className="card mt-4 divide-y divide-black/5 px-5">
          {friends.length === 0 && <li className="py-6 text-center text-ink-soft">No friends yet. Add some or share your invite link.</li>}
          {friends.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <span className="flex items-center gap-3"><Avatar id={p.id} name={p.full_name} /> {p.full_name}</span>
              <button className="text-[13px] text-ink-faint hover:text-red-600" onClick={async () => { await s.rpc("remove_friend", { target: p.id }); refresh(); }}>Remove</button>
            </li>
          ))}
        </ul>
        {suggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold tracking-tight">People you may know</h3>
            <p className="text-[13px] text-ink-soft">Friends of your friends.</p>
            <ul className="card mt-3 divide-y divide-black/5 px-5">
              {suggestions.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-3"><Avatar id={p.id} name={p.full_name} /> <span>{p.full_name}<span className="ml-2 text-[12px] text-ink-faint">{p.mutual} mutual</span></span></span>
                  <button className="btn-ghost !py-1.5 !text-[14px]" onClick={async () => { await s.rpc("add_friend", { target: p.id }); refresh(); }}>Add</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <section>
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">Groups <span className="rounded bg-kiwi-100 px-1.5 py-0.5 text-[11px] font-semibold text-kiwi-700">PLUS</span></h2>
        <p className="mt-1 text-[14px] text-ink-soft">Join a verified community and see its members' reviews — even if you don't know anyone yet.</p>
        <div className="mt-4 space-y-3">
          {allGroups.map((g) => {
            const mine = myGroups.find((m) => m.id === g.id);
            return (
              <div key={g.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-semibold">{g.name}</h3><p className="text-[14px] text-ink-soft">{g.description}</p></div>
                  {joined.has(g.id) ? <button className="btn-ghost !py-1.5 !text-[14px]" onClick={async () => { await s.from("group_members").delete().eq("group_id", g.id).eq("user_id", me); refresh(); }}>Leave</button>
                    : <button className="btn-primary !py-1.5 !text-[14px]" onClick={async () => { const { data } = await s.rpc("join_group", { gslug: g.slug }); setMsg({ ...msg, [g.id]: data === "ok" ? "" : data }); refresh(); }}>Join</button>}
                </div>
                {mine && (
                  <label className="mt-3 flex items-center gap-2 text-[14px]">
                    <input type="checkbox" className="accent-kiwi-600" checked={mine.visible} onChange={async (e) => { await s.from("group_members").update({ visible: e.target.checked }).eq("group_id", g.id).eq("user_id", me); refresh(); }} />
                    Let this group see my reviews
                  </label>
                )}
                {msg[g.id] && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[14px] text-amber-900">{msg[g.id]}</p>}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[13px] text-ink-faint">Want a group for your school, company or building? Contact us — groups are created on request.</p>
      </section>
    </div>
  );
}
