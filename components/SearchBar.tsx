"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, CITIES } from "@/lib/categories";

export default function SearchBar({ initial, groups = [], signedIn = false }: { initial?: { service?: string; city?: string; circle?: string }; groups?: { slug: string; name: string }[]; signedIn?: boolean }) {
  const router = useRouter();
  const [service, setService] = useState(initial?.service ?? "all");
  const [city, setCity] = useState(initial?.city ?? "Chicago");
  const [circle, setCircle] = useState(initial?.circle ?? "all");
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams({ service, city });
    if (circle !== "all") p.set("circle", circle);
    router.push(`/search?${p}`);
  };
  const sel = "w-full appearance-none bg-transparent px-5 py-3 text-[15px] outline-none";
  return (
    <form onSubmit={go} className="mx-auto w-full max-w-3xl rounded-[28px] bg-white p-2 shadow-pop ring-1 ring-black/5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
        <label className="flex-1 rounded-2xl hover:bg-black/[0.03]">
          <span className="block px-5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Service</span>
          <select className={sel} value={service} onChange={(e) => setService(e.target.value)}>
            <option value="all">All services</option>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>)}
          </select>
        </label>
        <div className="hidden h-8 w-px bg-black/10 sm:block" />
        <label className="flex-1 rounded-2xl hover:bg-black/[0.03]">
          <span className="block px-5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Where</span>
          <select className={sel} value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="hidden h-8 w-px bg-black/10 sm:block" />
        <label className="flex-1 rounded-2xl hover:bg-black/[0.03]">
          <span className="flex items-center gap-1.5 px-5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Whose reviews <span className="rounded bg-kiwi-100 px-1.5 py-px text-[10px] text-kiwi-700">PLUS</span>
          </span>
          <select className={sel} value={circle} onChange={(e) => setCircle(e.target.value)} disabled={!signedIn} title={signedIn ? "" : "Sign in to filter by your network"}>
            <option value="all">{signedIn ? "My whole network" : "Sign in to unlock"}</option>
            {signedIn && <option value="friends">Friends only</option>}
            {groups.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
          </select>
        </label>
        <button className="btn-primary m-1 !px-7 !py-3.5" type="submit">Search</button>
      </div>
    </form>
  );
}
