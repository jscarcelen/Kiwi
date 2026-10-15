"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

export default function ExploreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-ink-soft hover:bg-black/5">Explore <span className={`text-[10px] transition ${open ? "rotate-180" : ""}`}>▼</span></button>
      {open && (
        <div className="absolute left-0 top-11 z-50 w-64 rounded-2xl bg-white p-2 shadow-pop ring-1 ring-black/5">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/search?service=${c.slug}&city=Chicago`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-black/5">
              <span className="text-xl">{c.emoji}</span><span><span className="block text-[14px] font-medium text-ink">{c.label}</span><span className="block text-[12px] text-ink-faint">{c.blurb}</span></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
