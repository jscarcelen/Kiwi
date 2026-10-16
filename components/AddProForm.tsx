"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { useCities } from "@/lib/cities";
import { QUESTIONS, type Answers } from "@/lib/intake";
import { canShareNatively, shareNative } from "@/lib/native";
import { track } from "@/lib/track";

const Star = ({ on }: { on: boolean }) => <svg width="36" height="36" viewBox="0 0 20 20" fill="currentColor" className={on ? "text-amber-400" : "text-black/15"}><path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L10 14.9l-5.3 2.8 1.1-5.9L1.5 7.7l5.9-.8L10 1.5z" /></svg>;

export default function AddProForm({ initialCategory = "", initialCity = "Chicago", myName = "" }: { initialCategory?: string; initialCity?: string; myName?: string }) {
  const CITIES = useCities().map((c) => c.name);
  const s = createClient();
  const [name, setName] = useState(""); const [cat, setCat] = useState(initialCategory); const [city, setCity] = useState(initialCity);
  const [phone, setPhone] = useState(""); const [note, setNote] = useState("");
  const [rating, setRating] = useState(0); const [hover, setHover] = useState(0); const [comment, setComment] = useState("");
  const [ans, setAns] = useState<Answers>({});
  const [dupes, setDupes] = useState<{ id: string; company: string; category: string; city: string }[]>([]);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; token: string } | null>(null);
  const [origin, setOrigin] = useState(""); const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (name.trim().length < 3 && phone.replace(/\D/g, "").length < 7) return setDupes([]);
      const { data } = await s.rpc("find_similar_pros", { nm: name, ph: phone, cty: city });
      setDupes(data ?? []);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, city]);

  const qs = cat ? QUESTIONS[cat] ?? [] : [];
  const toggle = (qid: string, v: string, multi: boolean) => setAns((a) => { const cur = a[qid] ?? []; return { ...a, [qid]: multi ? (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]) : cur[0] === v ? [] : [v] }; });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!cat) return setErr("Choose a service.");
    if (!rating) return setErr("Add your rating.");
    setBusy(true);
    const attrs = Object.fromEntries(Object.entries(ans).filter(([, v]) => v.length));
    const { data, error } = await s.rpc("add_pro", { p_name: name, p_category: cat, p_city: city, p_phone: phone, p_note: note, p_rating: rating, p_comment: comment, p_attrs: attrs });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data?.error) return setErr(data.error);
    track("pro_added", { category: cat });
    setDone(data);
  };

  if (done) {
    const link = `${origin}/claim/${done.token}`;
    const first = name.trim().split(" ")[0];
    const msg = `Hi ${first}! I recommended you on WOM — a place where people find trusted local pros through friends. Claim your free profile here so people can reach you: ${link}${myName ? " — " + myName.split(" ")[0] : ""}`;
    const btn = "btn-ghost !px-4 !py-2 !text-[14px]";
    return (
      <div className="card p-6 sm:p-8">
        <div className="text-4xl">🎉</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{name} is on WOM</h2>
        <p className="mt-2 text-ink-soft">Your friends and communities can now find them, with your rating. Invite {first} to claim the profile — you earn credits when they do, and they can add photos, services and contact details.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a className="btn-primary !px-5 !py-2 !text-[14px]" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className={btn} href={`sms:?&body=${encodeURIComponent(msg)}`}>Messages</a>
          {canShareNatively() && <button className={btn} onClick={() => shareNative({ title: "Claim your WOM profile", text: msg, url: link })}>Share…</button>}
          <button className={btn} onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>{copied ? "Copied ✓" : "Copy claim link"}</button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-[14px]"><Link href={`/providers/${done.id}`} className="font-semibold text-brand-700 hover:underline">View profile →</Link><Link href="/add-pro" className="text-ink-soft hover:underline" onClick={() => location.assign("/add-pro")}>Add another pro</Link></div>
      </div>
    );
  }

  const input = "input";
  return (
    <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
      <div><label className="label">Their name or business name</label><input className={input} required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rosa's Cleaning" /></div>
      {dupes.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-3 text-[14px] text-amber-900">
          <b>Already on WOM?</b>
          <ul className="mt-1 space-y-1">{dupes.map((d) => <li key={d.id}><Link className="font-medium underline" href={`/providers/${d.id}`}>{d.company}</Link> · {d.city} — rate them there instead</li>)}</ul>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Service</label><select className={input} required value={cat} onChange={(e) => { setCat(e.target.value); setAns({}); }}><option value="">Choose…</option>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>)}</select></div>
        <div><label className="label">City</label><input className={input} list="cities" value={city} onChange={(e) => setCity(e.target.value)} /><datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist></div>
      </div>
      <div><label className="label">Their phone (optional)</label><input className={input} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(312) 555-0123" /><p className="mt-1 text-[12.5px] text-ink-faint">Only you and your friends & communities can see it, until they claim the profile.</p></div>
      {qs.length > 0 && (
        <div className="space-y-4 rounded-2xl bg-black/[0.03] p-4">
          <p className="text-[13px] font-semibold text-ink-soft">What do they offer? (optional — helps people find them)</p>
          {qs.filter((q) => !["frequency"].includes(q.id)).map((q) => (
            <fieldset key={q.id}><legend className="text-[14px] font-medium">{q.title}</legend>
              <div className="mt-2 flex flex-wrap gap-2">{q.options.map((o) => { const on = (ans[q.id] ?? []).includes(o.value); return <button type="button" key={o.value} aria-pressed={on} onClick={() => toggle(q.id, o.value, q.type === "multi")} className={`rounded-full border px-3.5 py-1.5 text-[14px] ${on ? "border-brand-600 bg-brand-600 text-white" : "border-black/10 bg-white"}`}>{o.label}</button>; })}</div>
            </fieldset>))}
        </div>
      )}
      <div><label className="label">What are they like to work with? (optional)</label><textarea className={input} rows={2} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Short description in your own words" /></div>
      <div>
        <label className="label">Your rating</label>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>{[1, 2, 3, 4, 5].map((i) => <button type="button" key={i} aria-label={`${i} stars`} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)}><Star on={(hover || rating) >= i} /></button>)}</div>
        <textarea className={input + " mt-3"} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Your review (optional) — visible to your friends & communities" />
      </div>
      <p className="text-[12.5px] text-ink-faint">Only add pros you've personally used. Profiles are created from your recommendation, and the pro can claim, edit or remove theirs at any time. By adding you agree to our <Link href="/terms" className="underline">Terms</Link>.</p>
      {err && <p className="text-[14px] text-red-600">{err}</p>}
      <button className="btn-primary w-full !py-3.5" disabled={busy}>{busy ? "Adding…" : "Add pro & share my rating"}</button>
    </form>
  );
}
