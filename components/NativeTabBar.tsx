"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNative } from "@/lib/native";

const I = (d: string) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const TABS = [
  { href: "/", label: "Home", icon: I("M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"), match: (p: string) => p === "/" },
  { href: "/search", label: "Search", icon: I("M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3"), match: (p: string) => p.startsWith("/search") || p.startsWith("/providers") },
  { href: "/network", label: "Network", icon: I("M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8"), match: (p: string) => p.startsWith("/network") || p.startsWith("/c/") || p.startsWith("/invite") },
  { href: "/settings", label: "Account", icon: I("M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"), match: (p: string) => p.startsWith("/settings") || p.startsWith("/login") || p.startsWith("/signup") || p.startsWith("/provider") },
];

export default function NativeTabBar() {
  const path = usePathname();
  const [native, setNative] = useState(false);
  useEffect(() => setNative(isNative()), []);
  if (!native || path.startsWith("/admin")) return null;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-[2147482000] border-t border-black/10 bg-white/95 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((t) => {
          const on = t.match(path);
          return <li key={t.href} className="flex-1"><Link href={t.href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${on ? "text-brand-600" : "text-ink-faint"}`}>{t.icon}{t.label}</Link></li>;
        })}
      </ul>
    </nav>
  );
}
