"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CITIES } from "@/lib/categories";
import { HEADINGS, QUESTIONS } from "@/lib/intake";

export default function ProviderSignupForm({ refId }: { refId?: string }) {
  const router = useRouter();
  const [f, setF] = useState({ full_name: "", company: "", email: "", password: "", phone: "", category: "cleaning", city: "Chicago", description: "" });
  const [regions, setRegions] = useState<string[]>(["Chicago"]);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const [attrs, setAttrs] = useState<Record<string, string[]>>({});
  const set = (k: string) => (e: any) => { setF({ ...f, [k]: e.target.value }); if (k === "category") setAttrs({}); };
  const qs = QUESTIONS[f.category] ?? [];
  const eff = (id: string, all: string[]) => attrs[id] ?? all;
  const toggleAttr = (id: string, all: string[], v: string) => { const c = eff(id, all); setAttrs({ ...attrs, [id]: c.includes(v) ? c.filter((x) => x !== v) : [...c, v] }); };
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr("");
      const s = createClient();
      const { data, error } = await s.auth.signUp({ email: f.email, password: f.password, options: { data: { ...f, password: undefined, regions: regions.join(","), is_provider: "true", ...(refId ? { ref: refId } : {}), attributes: Object.fromEntries(qs.map((q) => [q.id, eff(q.id, q.options.map((o) => o.value))])) } } });
      if (error) { setErr(error.message); setBusy(false); return; }
      if (!data.session) { setNote("Check your email to confirm your account, then sign in."); setBusy(false); return; }
      if (file && data.user) {
        const path = `${data.user.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
        const up = await s.storage.from("provider-photos").upload(path, file);
        if (!up.error) {
          const url = s.storage.from("provider-photos").getPublicUrl(path).data.publicUrl;
          await s.from("providers").update({ photo_url: url }).eq("owner_id", data.user.id);
        }
      }
      router.push("/provider/dashboard"); router.refresh();
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Your name</label><input className="input" required value={f.full_name} onChange={set("full_name")} /></div>
        <div><label className="label">Company name</label><input className="input" required value={f.company} onChange={set("company")} /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={set("email")} /></div>
        <div><label className="label">Phone</label><input className="input" required value={f.phone} onChange={set("phone")} /></div>
        <div><label className="label">Password</label><input className="input" type="password" minLength={6} required value={f.password} onChange={set("password")} /></div>
        <div><label className="label">Service</label>
          <select className="input" value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></div>
      </div>
      <div><label className="label">Services you offer (customers are matched on these)</label>
        <div className="space-y-4 rounded-2xl bg-black/[0.03] p-4">{qs.map((q) => { const all = q.options.map((o) => o.value); return (
          <div key={q.id}><div className="text-[13px] font-semibold">{HEADINGS[q.id]}</div><div className="mt-1.5 flex flex-wrap gap-2">{q.options.map((o) => { const on = eff(q.id, all).includes(o.value); return <button type="button" key={o.value} onClick={() => toggleAttr(q.id, all, o.value)} className={`rounded-full px-3 py-1.5 text-[13px] ${on ? "bg-navy text-white" : "bg-white ring-1 ring-black/10"}`}>{o.label}</button>; })}</div></div>); })}</div></div>
      <div><label className="label">Regions you operate in</label>
        <div className="flex flex-wrap gap-2">{CITIES.map((c) => {
          const on = regions.includes(c);
          return <button type="button" key={c} onClick={() => setRegions(on ? regions.filter((x) => x !== c) : [...regions, c])} className={`rounded-full px-4 py-2 text-[14px] ${on ? "bg-navy text-white" : "bg-black/5"}`}>{c}</button>;
        })}</div></div>
      <div><label className="label">Description</label><textarea className="input min-h-[100px]" value={f.description} onChange={set("description")} placeholder="What do you offer? What makes you great?" /></div>
      <div><label className="label">Photo or logo</label><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-[14px] file:mr-3 file:rounded-full file:border-0 file:bg-black/5 file:px-4 file:py-2" /></div>
      {err && <p className="text-[14px] text-red-600">{err}</p>}
      {note && <p className="rounded-xl bg-brand-50 p-3 text-[14px] text-brand-700">{note}</p>}
      <button className="btn-primary w-full" disabled={busy || regions.length === 0}>{busy ? "Creating…" : "Create provider account"}</button>
      <p className="text-center text-[14px] text-ink-soft">Already listed? <Link className="font-semibold text-brand-700" href="/login?next=/provider/dashboard">Sign in</Link></p>
    </form>
  );
}
