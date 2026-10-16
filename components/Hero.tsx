"use client";
import { useState } from "react";
import { CITIES } from "@/lib/categories";
import IntakeModal from "./IntakeModal";
import { LogoMark } from "./Logo";
import TourButton from "./TourButton";
import HeroSearch from "./HeroSearch";
import type { Sug } from "@/lib/suggestions";

export default function Hero({ stats, headline = "Whatever you need, ask the people you trust.", subtitle = "Tell us what you need. WOM finds local pros your friends and communities already rate highly." }: { stats: { label: string; value: string }[]; headline?: string; subtitle?: string }) {
  const [text, setText] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<string | null>(null);
  const [sug, setSug] = useState<Sug | null>(null);
  const launch = (c: string | null = null, g: Sug | null = null) => { setCat(c); setSug(g); setOpen(true); };
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_20%,rgba(34,81,255,0.45),transparent),radial-gradient(50%_70%_at_0%_100%,rgba(90,169,255,0.28),transparent)]" />
      <LogoMark tone="dark" size={460} className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 opacity-[0.14] md:block" />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pb-24 sm:pt-24">
        <p className="text-[14px] font-semibold text-brand-200">Trusted by the people you trust</p>
        <h1 className="mt-3 max-w-2xl text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">{headline}</h1>
        <p className="mt-5 max-w-xl text-lg text-white/80">{subtitle}</p>

        <HeroSearch onAssist={(c) => { setCity(c); launch(); }} />
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-white/75"><span>🔒 No calls or texts until you message a pro.</span><TourButton className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">▶ See how WOM works (1 min)</TourButton></div>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">{stats.map((s) => <div key={s.label}><div className="text-3xl font-semibold tracking-tight">{s.value}</div><div className="text-[14px] text-white/70">{s.label}</div></div>)}</div>
      </div>
      {open && <IntakeModal open onClose={() => setOpen(false)} initialText={cat || sug ? "" : text} initialCategory={cat} initialSuggestion={sug} city={city} />}
    </section>
  );
}
