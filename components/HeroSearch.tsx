"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { nearestCity, useCities } from "@/lib/cities";
import { QUESTIONS, answersToParams, type Answers } from "@/lib/intake";


export default function HeroSearch({ onAssist, defaultCity }: { onAssist: (city: string) => void; defaultCity?: string }) {
  const CITIES = useCities().map((c) => c.name);
  const cityList = useCities();
  const router = useRouter();
  const [city, setCity] = useState(defaultCity || "Chicago");
  const [located, setLocated] = useState<"idle" | "busy" | "ok" | "no">("idle");
  const [cat, setCat] = useState("");
  const [ans, setAns] = useState<Answers>({});

  const locate = () => {
    if (!navigator.geolocation) return setLocated("no");
    setLocated("busy");
    navigator.geolocation.getCurrentPosition(
      (p) => { setCity(nearestCity(cityList, p.coords.latitude, p.coords.longitude)); setLocated("ok"); },
      () => setLocated("no"), { timeout: 8000, maximumAge: 600000 });
  };
  useEffect(() => {
    // auto-detect only if the user already granted permission (no surprise prompt on page load)
    (navigator as any).permissions?.query?.({ name: "geolocation" }).then((r: any) => { if (r.state === "granted") locate(); }).catch(() => {});
  }, []);

  const qs = cat ? QUESTIONS[cat] ?? [] : [];
  const toggle = (qid: string, v: string, multi: boolean) =>
    setAns((a) => {
      const cur = a[qid] ?? [];
      const next = multi ? (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]) : cur[0] === v ? [] : [v];
      return { ...a, [qid]: next };
    });
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cat) return;
    router.push(`/search?${new URLSearchParams({ service: cat, city, ...answersToParams(ans) })}`);
  };
  const sel = "w-full appearance-none rounded-xl bg-transparent px-1 py-1 text-[16px] font-medium outline-none";
  const arrow = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint"><path d="M6 9l6 6 6-6" /></svg>;

  return (
    <form onSubmit={go} className="mt-8 max-w-2xl rounded-3xl bg-white p-4 text-ink shadow-pop sm:p-5">
      <label className="relative block rounded-2xl border border-black/10 px-4 py-2.5 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
        <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          <span>Where</span>
          <button type="button" onClick={locate} className="normal-case tracking-normal text-brand-700 hover:underline">
            {located === "busy" ? "Locating…" : located === "ok" ? "📍 Using your location" : located === "no" ? "Location unavailable" : "📍 Use my location"}
          </button>
        </span>
        <select className={sel} value={city} onChange={(e) => { setCity(e.target.value); setLocated("idle"); }} aria-label="Location">{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
        {arrow}
      </label>

      <label className="relative mt-3 block rounded-2xl border border-black/10 px-4 py-2.5 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">What do you need?</span>
        <select className={sel} value={cat} onChange={(e) => { setCat(e.target.value); setAns({}); }} aria-label="Service category">
          <option value="">Choose a service…</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>)}
        </select>
        {arrow}
      </label>

      {qs.length > 0 && (
        <div className="mt-4 space-y-4 rounded-2xl bg-black/[0.03] p-4">
          {qs.map((q) => (
            <fieldset key={q.id}>
              <legend className="text-[14px] font-semibold">{q.title}{q.type === "multi" && <span className="ml-1.5 text-[12px] font-normal text-ink-faint">select all that apply</span>}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const on = (ans[q.id] ?? []).includes(o.value);
                  return <button type="button" key={o.value} aria-pressed={on} onClick={() => toggle(q.id, o.value, q.type === "multi")} className={`rounded-full border px-3.5 py-2 text-[14px] transition ${on ? "border-brand-600 bg-brand-600 text-white" : "border-black/10 bg-white hover:border-brand-600/50"}`}>{o.label}</button>;
                })}
              </div>
            </fieldset>
          ))}
          <p className="text-[12.5px] text-ink-faint">All optional — skip any question to see more pros.</p>
        </div>
      )}

      <button disabled={!cat} className="btn-primary mt-4 w-full !py-3.5 disabled:cursor-not-allowed disabled:opacity-40">{cat ? "Find a pro →" : "Pick a service to continue"}</button>
      <button type="button" onClick={() => onAssist(city)} className="mt-3 block w-full text-center text-[13.5px] text-ink-soft hover:text-brand-700">Not sure? <span className="font-semibold underline underline-offset-2">Describe it in your own words</span></button>
    </form>
  );
}
