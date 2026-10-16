"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "./charts";

type G = { id: string; name: string; description: string | null; members: number; official: boolean };
export default function UniversitiesCard() {
  const s = createClient();
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState({ id: "", name: "", domain: "", city: "Chicago", description: "" });
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const { data: g, error } = await s.from("groups").select("id,name,description,email_domain,city,owner_id").is("owner_id", null).order("name");
    if (error) return setMsg(error.message);
    const { data: counts } = await s.rpc("admin_communities");
    const m = new Map<string, number>((counts ?? []).map((c: any) => [c.id, Number(c.members)]));
    setRows((g ?? []).map((x: any) => ({ ...x, members: m.get(x.id) ?? 0 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);
  const inp = "mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] outline-none";
  async function save() {
    const { error } = await s.rpc("admin_upsert_community", { gid: f.id || null, nm: f.name, descr: f.description, domain: f.domain, cty: f.city });
    setMsg(error ? error.message : "Saved."); if (!error) { setF({ id: "", name: "", domain: "", city: "Chicago", description: "" }); load(); }
  }
  async function del(g: any) { if (!confirm(`Delete ${g.name}? Members are removed from it.`)) return; const { error } = await s.rpc("admin_delete_community", { gid: g.id }); setMsg(error ? error.message : "Deleted."); load(); }
  return (
    <Card title="Verified university communities" sub="People who confirm an email on the domain are offered to join with a ✓ Verified badge — no invite needed.">
      {msg && <p className="mb-3 rounded-xl bg-brand-50 p-3 text-[13px] text-brand-700">{msg}</p>}
      <ul className="divide-y divide-black/5 text-[14px]">{rows.map((g) => (
        <li key={g.id} className="flex items-center justify-between gap-3 py-2.5">
          <span><b>{g.name}</b> {g.email_domain ? <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-800">✓ @{g.email_domain}</span> : <span className="ml-1 text-[11px] text-ink-faint">open</span>}<br /><span className="text-[12.5px] text-ink-faint">{g.city || "—"} · {g.members} members</span></span>
          <span className="whitespace-nowrap"><button className="mr-3 text-brand-700 hover:underline" onClick={() => setF({ id: g.id, name: g.name, domain: g.email_domain ?? "", city: g.city ?? "", description: g.description ?? "" })}>Edit</button><button className="text-red-600 hover:underline" onClick={() => del(g)}>Delete</button></span>
        </li>))}</ul>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[12.5px] text-ink-soft">Name<input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Northwestern University" /></label>
        <label className="block text-[12.5px] text-ink-soft">Email domain<input className={inp} value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} placeholder="northwestern.edu" /></label>
        <label className="block text-[12.5px] text-ink-soft">City<input className={inp} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></label>
        <label className="block text-[12.5px] text-ink-soft">Description<input className={inp} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Students, faculty and staff" /></label>
      </div>
      <div className="mt-3 flex gap-2"><button className="btn-primary !py-2" disabled={!f.name} onClick={save}>{f.id ? "Save changes" : "Add community"}</button>{f.id && <button className="btn-ghost !py-2" onClick={() => setF({ id: "", name: "", domain: "", city: "Chicago", description: "" })}>Cancel</button>}</div>
    </Card>
  );
}
