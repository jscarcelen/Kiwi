"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "./charts";

type Row = { city: string; active: boolean; users: number; pros: number; reviews: number; communities: number; live: boolean };
export default function CitiesCard() {
  const s = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [f, setF] = useState({ name: "", lat: "", lng: "" });
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const { data, error } = await s.rpc("admin_city_stats");
    if (error) setMsg(error.message.includes("function") ? "Run supabase/cities_universities.sql first." : error.message); else setRows(data ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);
  const inp = "mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] outline-none";
  async function add() {
    const { error } = await s.rpc("admin_upsert_city", { nm: f.name, la: Number(f.lat), ln: Number(f.lng), act: true, srt: 100 });
    setMsg(error ? error.message : `${f.name} added.`); if (!error) { setF({ name: "", lat: "", lng: "" }); load(); }
  }
  async function toggle(r: Row) {
    const { data: c } = await s.from("cities").select("*").eq("name", r.city).maybeSingle();
    if (!c) return;
    await s.rpc("admin_upsert_city", { nm: c.name, la: c.lat, ln: c.lng, act: !r.active, srt: c.sort }); load();
  }
  async function del(r: Row) { if (!confirm(`Remove ${r.city} from the list? Existing profiles keep their city.`)) return; await s.rpc("admin_delete_city", { nm: r.city }); load(); }
  return (
    <Card title="Cities" sub="Shown in every location dropdown. A city is 'live' at 100+ members, 10+ pros and 5+ reviews.">
      {msg && <p className="mb-3 rounded-xl bg-brand-50 p-3 text-[13px] text-brand-700">{msg}</p>}
      <div className="overflow-x-auto"><table className="w-full text-[13.5px]"><thead className="text-left text-[12px] text-ink-faint"><tr><th>City</th><th>Members</th><th>Pros</th><th>Reviews</th><th>Communities</th><th>Status</th><th /></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.city} className="border-t border-black/5"><td className="py-2 font-medium">{r.city}{!r.active && <span className="ml-1.5 text-[11px] text-ink-faint">(hidden)</span>}</td><td>{r.users}</td><td>{r.pros}</td><td>{r.reviews}</td><td>{r.communities}</td><td>{r.live ? <span className="rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-800">LIVE</span> : <span className="rounded bg-black/5 px-1.5 py-0.5 text-[11px] text-ink-soft">building</span>}</td><td className="whitespace-nowrap text-right"><button className="mr-3 text-brand-700 hover:underline" onClick={() => toggle(r)}>{r.active ? "Hide" : "Show"}</button><button className="text-red-600 hover:underline" onClick={() => del(r)}>Remove</button></td></tr>)}</tbody></table></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <label className="block text-[12.5px] text-ink-soft sm:col-span-2">New city<input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Boston" /></label>
        <label className="block text-[12.5px] text-ink-soft">Latitude<input className={inp} value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} placeholder="42.3601" /></label>
        <label className="block text-[12.5px] text-ink-soft">Longitude<input className={inp} value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value })} placeholder="-71.0589" /></label>
      </div>
      <button className="btn-primary mt-3 !py-2" disabled={!f.name || !f.lat || !f.lng} onClick={add}>Add city</button>
      <p className="mt-2 text-[12px] text-ink-faint">Coordinates are used to pick the nearest city from a user's location.</p>
    </Card>
  );
}
