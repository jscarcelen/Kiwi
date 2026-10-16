"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { useCities } from "@/lib/cities";
import { HEADINGS, QUESTIONS } from "@/lib/intake";

/**
 * One service listing of a pro (e.g. "Cleaning" or "Dog walking" under the same account). `base` carries what the listings share
 * (contact name, phone, email, photo); `listing` is set when editing. Each listing has its own category, description, regions,
 * offered services and reviews, and shows up in its own searches.
 */
export default function ServiceForm({ ownerId, base, listing, usedCategories, canDelete }: {
  ownerId: string;
  base: { contact_name: string | null; phone: string | null; email: string | null; photo_url: string | null; city: string; company: string };
  listing?: any;
  usedCategories: string[];
  canDelete?: boolean;
}) {
  const CITIES = useCities().map((c) => c.name);
  const router = useRouter();
  const firstFree = CATEGORIES.find((c) => !usedCategories.includes(c.slug))?.slug ?? "cleaning";
  const [category, setCategory] = useState<string>(listing?.category ?? firstFree);
  const [company, setCompany] = useState<string>(listing?.company ?? base.company);
  const [description, setDescription] = useState<string>(listing?.description ?? "");
  const [regions, setRegions] = useState<string[]>(listing?.regions?.length ? listing.regions : [base.city]);
  const [attrs, setAttrs] = useState<Record<string, string[]>>(listing?.attributes ?? {});
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const qs = QUESTIONS[category] ?? [];
  const eff = (id: string, all: string[]) => attrs[id] ?? all;
  const toggle = (id: string, all: string[], v: string) => { const c = eff(id, all); setAttrs({ ...attrs, [id]: c.includes(v) ? c.filter((x) => x !== v) : [...c, v] }); };

  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr("");
      const s = createClient();
      const attributes = Object.fromEntries(qs.map((q) => [q.id, eff(q.id, q.options.map((o) => o.value))]));
      const row = { company: company.trim(), category, description, regions, city: regions[0] ?? base.city, attributes };
      const { data, error } = listing
        ? await s.from("providers").update(row).eq("id", listing.id).select("id").single()
        : await s.from("providers").insert({ ...row, owner_id: ownerId, contact_name: base.contact_name, phone: base.phone, email: base.email, photo_url: base.photo_url }).select("id").single();
      if (error) { setErr(error.message); setBusy(false); return; }
      router.push(`/provider/dashboard?listing=${data.id}`); router.refresh();
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Service</label>
          <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setAttrs({}); }}>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.label}{usedCategories.includes(c.slug) && c.slug !== listing?.category ? " (you already list this)" : ""}</option>)}
          </select></div>
        <div><label className="label">Name shown for this service</label><input className="input" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Maria's Dog Walking" /></div>
      </div>
      <div><label className="label">What you offer (customers are matched on these)</label>
        <div className="space-y-4 rounded-2xl bg-black/[0.03] p-4">{qs.map((q) => { const all = q.options.map((o) => o.value); return (
          <div key={q.id}><div className="text-[13px] font-semibold">{HEADINGS[q.id]}</div><div className="mt-1.5 flex flex-wrap gap-2">{q.options.map((o) => { const on = eff(q.id, all).includes(o.value); return <button type="button" key={o.value} onClick={() => toggle(q.id, all, o.value)} className={`rounded-full px-3 py-1.5 text-[13px] ${on ? "bg-navy text-white" : "bg-white ring-1 ring-black/10"}`}>{o.label}</button>; })}</div></div>); })}</div></div>
      <div><label className="label">Regions you serve for this service</label>
        <div className="flex flex-wrap gap-2">{CITIES.map((c) => { const on = regions.includes(c); return <button type="button" key={c} onClick={() => setRegions(on ? regions.filter((x) => x !== c) : [...regions, c])} className={`rounded-full px-4 py-2 text-[14px] ${on ? "bg-navy text-white" : "bg-black/5"}`}>{c}</button>; })}</div></div>
      <div><label className="label">Description</label><textarea className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you offer? What makes you great at this?" /></div>
      {err && <p className="text-[14px] text-red-600">{err}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" disabled={busy || regions.length === 0}>{busy ? "Saving…" : listing ? "Save service" : "Add this service"}</button>
        {listing && canDelete && (
          <button type="button" className="rounded-full border border-red-200 px-4 py-2 text-[14px] text-red-600" onClick={async () => {
            if (!confirm("Remove this service? Its reviews and requests go with it. Your other services stay.")) return;
            const { error } = await createClient().from("providers").delete().eq("id", listing.id);
            if (error) return setErr(error.message);
            router.push("/provider/dashboard"); router.refresh();
          }}>Remove this service</button>
        )}
      </div>
      <p className="text-[12px] text-ink-faint">Customers find each service in its own searches, with its own reviews. Your contact details and photo are shared across your services.</p>
    </form>
  );
}
