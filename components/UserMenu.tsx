"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/data";

export default function UserMenu({ name, avatarUrl, isProvider, isAdmin, credits = 0, perMonth = 5 }: { credits?: number; perMonth?: number; name: string; avatarUrl?: string | null; isProvider?: boolean; isAdmin?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, []);
  const item = "block w-full rounded-xl px-3 py-2.5 text-left text-[14px] text-ink hover:bg-black/5";
  return (
    <div ref={ref} className="relative ml-1">
      <button onClick={() => setOpen(!open)} aria-label="Account menu" className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-navy text-[13px] font-semibold text-white ring-2 ring-white transition hover:ring-brand-200">
        {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(name)}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl bg-white p-2 shadow-pop ring-1 ring-black/5" onClick={() => setOpen(false)}>
          <div className="px-3 py-2"><div className="truncate text-[14px] font-semibold">{name}</div><Link href="/network" className="mt-1.5 flex items-center justify-between rounded-lg bg-brand-50 px-2.5 py-1.5 text-[12px] font-semibold text-brand-700">🎁 {credits} credits<span className="font-normal text-brand-700/80">{Math.floor(credits / perMonth)} free month{Math.floor(credits / perMonth) === 1 ? "" : "s"}</span></Link></div>
          <div className="my-1 h-px bg-black/5" />
          <Link href="/network" className={item}>My network & invites</Link>
          <Link href="/add-pro" className={item}>Recommend a pro</Link>
          {isProvider && <Link href="/provider/dashboard" className={item}>Pro dashboard</Link>}
          {isAdmin && <Link href="/admin" className={item}>Admin console</Link>}
          {isAdmin && <Link href="/admin/feedback" className={item}>Feedback tracker</Link>}
          <button className={item} onClick={() => window.dispatchEvent(new CustomEvent("wom:tour"))}>Take the 1-min tour</button>
          <Link href="/settings" className={item}>Settings</Link>
          <div className="my-1 h-px bg-black/5" />
          <button className={`${item} text-red-600`} onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }}>Log out</button>
        </div>
      )}
    </div>
  );
}
