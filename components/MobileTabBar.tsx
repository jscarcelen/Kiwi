"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNative } from "@/lib/native";
import { useUnread } from "@/lib/unread";

const I = (d: string, size = 24) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const ICON = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3",
  people: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

// Bottom navigation on phones (and always inside the iOS app). "My network" is the hero action in the middle.
export default function MobileTabBar() {
  const path = usePathname();
  const unread = useUnread();
  const [native, setNative] = useState(false);
  useEffect(() => setNative(isNative()), []);
  if (path.startsWith("/admin")) return null;
  const on = (m: (p: string) => boolean) => m(path);
  const tab = (href: string, label: string, icon: string, active: boolean, badge = 0) => (
    <li className="flex-1" key={href}>
      <Link href={href} aria-current={active ? "page" : undefined} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-brand-600" : "text-ink-faint"}`}>
        {I(icon)}{label}
        {badge > 0 && <span className="absolute right-[22%] top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{badge > 9 ? "9+" : badge}</span>}
      </Link>
    </li>
  );
  const netActive = on((p) => p.startsWith("/network") || p.startsWith("/c/") || p.startsWith("/invite") || p.startsWith("/add-pro"));
  return (
    <nav aria-label="Main" data-native={native ? "1" : "0"} className="mobile-tabbar fixed inset-x-0 bottom-0 z-[2147482000] border-t border-black/10 bg-white/95 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="mx-auto flex w-full max-w-lg items-end justify-around px-1">
        {tab("/", "Home", ICON.home, on((p) => p === "/"))}
        {tab("/search", "Search", ICON.search, on((p) => p.startsWith("/search") || p.startsWith("/providers")))}
        <li className="flex-1" key="net">
          <Link href="/network" aria-current={netActive ? "page" : undefined} className="relative -mt-4 flex flex-col items-center gap-0.5 pb-2 text-[11px] font-semibold text-brand-700">
            <span className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-pop ${netActive ? "bg-brand-600" : "bg-navy"}`}>{I(ICON.people, 26)}</span>
            My network
          </Link>
        </li>
        {tab("/notifications", "Alerts", ICON.bell, on((p) => p.startsWith("/notifications")), unread)}
        {tab("/settings", "Account", ICON.user, on((p) => p.startsWith("/settings") || p.startsWith("/login") || p.startsWith("/signup") || p.startsWith("/provider") || p.startsWith("/premium")))}
      </ul>
    </nav>
  );
}
