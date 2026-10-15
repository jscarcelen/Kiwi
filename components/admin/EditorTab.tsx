"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "./charts";

type Cfg = Record<string, any>;
const NUM = [
  ["free_community_limit", "Free communities per user"], ["credit_friend", "Credits per friend referral"], ["credit_supplier", "Credits per supplier referral"],
  ["credit_community", "Credits per community member"], ["credits_per_month", "Credits per free Premium month"],
] as const;

export default function EditorTab() {
  const s = createClient();
  const [cfg, setCfg] = useState<Cfg>({});
  const [msg, setMsg] = useState("");
  const [admins, setAdmins] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const loadAdmins = async () => { const { data } = await s.rpc("admin_list_admins"); setAdmins(data ?? []); };
  useEffect(() => {
    s.from("app_settings").select("key,value").then(({ data, error }) => { if (error) setMsg("Run supabase/admin.sql first."); else setCfg(Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]))); });
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (k: string, v: any) => setCfg((c) => ({ ...c, [k]: v }));
  async function save(keys: string[]) {
    for (const k of keys) { const { error } = await s.rpc("admin_set_setting", { k, v: cfg[k] }); if (error) return setMsg(error.message); }
    setMsg("Saved. Changes are live.");
  }
  async function setAdmin(flag: boolean, em = email) {
    const { data, error } = await s.rpc("admin_set_admin", { target_email: em, flag });
    setMsg(error ? error.message : data === "ok" ? "Updated." : data); setEmail(""); loadAdmins();
  }
  const ann = cfg.announcement ?? { enabled: false, text: "", link: "" };
  const inp = "mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] outline-none";
  return (
    <div className="space-y-4">
      {msg && <p className="rounded-xl bg-brand-50 p-3 text-[13px] text-brand-700">{msg}</p>}
      <Card title="Home page copy" sub="Headline and subtitle shown on the landing hero">
        <label className="block text-[13px] text-ink-soft">Headline<input className={inp} value={cfg.hero_headline ?? ""} onChange={(e) => set("hero_headline", e.target.value)} /></label>
        <label className="mt-3 block text-[13px] text-ink-soft">Subtitle<textarea rows={2} className={inp} value={cfg.hero_subtitle ?? ""} onChange={(e) => set("hero_subtitle", e.target.value)} /></label>
        <button className="btn-primary mt-4 !py-2" onClick={() => save(["hero_headline", "hero_subtitle"])}>Save copy</button>
      </Card>
      <Card title="Announcement banner" sub="A bar across the top of the home page">
        <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={!!ann.enabled} onChange={(e) => set("announcement", { ...ann, enabled: e.target.checked })} /> Show banner</label>
        <label className="mt-3 block text-[13px] text-ink-soft">Text<input className={inp} value={ann.text} onChange={(e) => set("announcement", { ...ann, text: e.target.value })} /></label>
        <label className="mt-3 block text-[13px] text-ink-soft">Link (optional, e.g. /network)<input className={inp} value={ann.link} onChange={(e) => set("announcement", { ...ann, link: e.target.value })} /></label>
        <button className="btn-primary mt-4 !py-2" onClick={() => save(["announcement"])}>Save banner</button>
      </Card>
      <Card title="Premium & credit rules" sub="Applied to new activity immediately">
        <div className="grid gap-3 sm:grid-cols-2">{NUM.map(([k, label]) => <label key={k} className="block text-[13px] text-ink-soft">{label}<input type="number" min={0} className={inp} value={cfg[k] ?? ""} onChange={(e) => set(k, Number(e.target.value))} /></label>)}</div>
        <button className="btn-primary mt-4 !py-2" onClick={() => save(NUM.map(([k]) => k))}>Save rules</button>
        <p className="mt-2 text-[12px] text-ink-faint">Community limit applies instantly. Credit values apply to the app's referral logic once wired to these settings (see CLAUDE.md).</p>
      </Card>
      <Card title="Admin team" sub="Admins can view stats, delete and block. Add by account email.">
        <ul className="divide-y divide-black/5 text-[14px]">{admins.map((a) => <li key={a.user_id} className="flex items-center justify-between py-2"><span>{a.full_name || "—"} <span className="text-ink-faint">{a.email}</span></span><button className="text-red-600 hover:underline" onClick={() => a.email && setAdmin(false, a.email)}>Remove</button></li>)}</ul>
        <div className="mt-3 flex gap-2"><input className={inp + " !mt-0"} placeholder="teammate@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /><button className="btn-primary !py-2" disabled={!email} onClick={() => setAdmin(true)}>Add admin</button></div>
      </Card>
    </div>
  );
}
