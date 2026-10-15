"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

// Lightweight first-party analytics: page views, active-time heartbeats, PWA/native installs.
export default function Tracker() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    track("page_view", {}, path);
  }, [path]);
  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    const native = !!(window as any).Capacitor?.isNativePlatform?.();
    if (native) track("native_open"); else if (standalone) track("pwa_open");
    if (native && !localStorage.getItem("wom_native_seen")) { localStorage.setItem("wom_native_seen", "1"); track("native_install"); }
    const onInstalled = () => track("pwa_install");
    window.addEventListener("appinstalled", onInstalled);
    const beat = setInterval(() => { if (document.visibilityState === "visible" && !location.pathname.startsWith("/admin")) track("heartbeat"); }, 30000);
    return () => { window.removeEventListener("appinstalled", onInstalled); clearInterval(beat); };
  }, []);
  return null;
}
