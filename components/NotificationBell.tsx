"use client";
import Link from "next/link";
import { useUnread } from "@/lib/unread";

export default function NotificationBell() {
  const n = useUnread();
  return (
    <Link href="/notifications" aria-label={n ? `${n} unread notifications` : "Notifications"} className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-black/5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
      {n > 0 && <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{n > 9 ? "9+" : n}</span>}
    </Link>
  );
}
