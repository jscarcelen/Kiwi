"use client";
import { useState } from "react";
import { CATEGORIES, CITIES } from "@/lib/categories";
import IntakeModal from "./IntakeModal";

export default function Hero({ stats }: { stats: { label: string; value: string }[] }) {
  const [text, setText] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<string | null>(null);
  const launch = (c: string | null = null) => { setCat(c); setOpen(true); };
  return (
    <section className="relative overflow-hidden bg-forest text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_20%,rgba(140,193,82,0.35),transparent),radial-gradient(50%_70%_at_0%_100%,rgba(106,168,79,0.25),transparent)]" />
      <svg className="pointer-events-none absolute -right-24 top-1/2 hidden h-[620px] w-[620px] -translate-y-1/2 opacity-[0.16] md:block" viewBox="0 0 200 200" aria-hidden>
        <circle cx="100" cy="100" r="92" fill="#7a553d" /><circle cx="100" cy="100" r="82" fill="#8cc152" /><circle cx="100" cy="100" r="26" fill="#eef6d9" />
        {Array.from({ length: 24 }).map((_, i) => { const a = (i / 24) * Math.PI * 2; return <ellipse key={i} cx={100 + Math.cos(a) * 52} cy={100 + Math.sin(a) * 52} rx="2.2" ry="4" transform={`rotate(${(a * 180) / Math.PI + 90} ${100 + Math.cos(a) * 52} ${100 + Math.sin(a) * 52})`} fill="#1d1d1f" />; })}
      </svg>
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pb-24 sm:pt-24">
        <p className="text-[14px] font-semibold text-kiwi-200">Trusted by the people you trust</p>
        <h1 className="mt-3 max-w-2xl text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">For everything home could be, ask your friends' pros.</h1>
        <p className="mt-5 max-w-xl text-lg text-white/80">Tell us what you need. Kiwi finds local pros your friends and communities already rate highly.</p>

        <form className="mt-8 max-w-2xl rounded-2xl bg-white p-3 text-ink shadow-pop" onSubmit={(e) => { e.preventDefault(); launch(); }}>
          <div className="flex items-center gap-3 px-3 py-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-soft"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input className="w-full bg-transparent py-1 text-[16px] outline-none placeholder:text-ink-faint" placeholder="Describe your project or need — be as detailed as you'd like!" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <select className="rounded-full border border-black/10 bg-white px-4 py-3 text-[15px] outline-none" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
            <button className="btn-primary flex-1 !py-3.5">Find a pro →</button>
          </div>
        </form>
        <div className="mt-4 flex max-w-2xl flex-wrap gap-2">
          {CATEGORIES.map((c) => <button key={c.slug} onClick={() => launch(c.slug)} className="rounded-full bg-white/10 px-4 py-2 text-[14px] backdrop-blur transition hover:bg-white/20">{c.emoji} {c.label}</button>)}
        </div>
        <p className="mt-5 flex items-center gap-2 text-[14px] text-white/70">🔒 No calls or texts until you message a pro.</p>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">{stats.map((s) => <div key={s.label}><div className="text-3xl font-semibold tracking-tight">{s.value}</div><div className="text-[14px] text-white/70">{s.label}</div></div>)}</div>
      </div>
      {open && <IntakeModal open onClose={() => setOpen(false)} initialText={cat ? "" : text} initialCategory={cat} city={city} />}
    </section>
  );
}
