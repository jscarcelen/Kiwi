"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { haptic, isNative } from "@/lib/native";

// Runs once at app start: native chrome (status bar, splash, haptics), offline banner, push notifications.
export default function NativeBoot() {
  const router = useRouter();
  const [offline, setOffline] = useState(false);
  const [askPush, setAskPush] = useState(false);

  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    if (!isNative()) return;
    document.documentElement.classList.add("is-native");
    (async () => {
      try { const { StatusBar, Style } = await import("@capacitor/status-bar"); await StatusBar.setStyle({ style: Style.Light }); } catch {}
      try { const { SplashScreen } = await import("@capacitor/splash-screen"); await SplashScreen.hide({ fadeOutDuration: 250 }); } catch {}
    })();
    let last = 0;
    const tap = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest?.("button, a, [role=tab], select");
      if (!el || Date.now() - last < 120) return;
      last = Date.now(); haptic("light");
    };
    document.addEventListener("click", tap, true);
    return () => document.removeEventListener("click", tap, true);
  }, []);

  // Push: register silently if already allowed, otherwise show a one-time soft prompt after sign-in.
  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false;
    (async () => {
      const { data } = await createClient().auth.getUser();
      if (!data.user || cancelled) return;
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const st = await PushNotifications.checkPermissions();
      if (st.receive === "granted") await register();
      else if (st.receive === "prompt" && !localStorage.getItem("wom_push_asked")) setTimeout(() => !cancelled && setAskPush(true), 6000);
    })().catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function register() {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.removeAllListeners();
    await PushNotifications.addListener("registration", async (t) => { await createClient().rpc("register_device", { tok: t.value, plat: "ios" }); });
    await PushNotifications.addListener("pushNotificationActionPerformed", (a) => { const url = (a.notification.data as any)?.url; if (typeof url === "string" && url.startsWith("/")) router.push(url); });
    await PushNotifications.register();
  }
  async function enable() {
    setAskPush(false); localStorage.setItem("wom_push_asked", "1");
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const r = await PushNotifications.requestPermissions();
    if (r.receive === "granted") { haptic("success"); await register(); }
  }

  return (
    <>
      {offline && <div role="status" className="fixed inset-x-0 top-0 z-[2147483001] bg-ink px-4 pb-2 text-center text-[13px] font-medium text-white" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>You're offline — some things may not load.</div>}
      {askPush && (
        <div className="fixed inset-x-4 z-[2147483001] rounded-2xl bg-white p-4 shadow-pop ring-1 ring-black/5" style={{ bottom: "calc(84px + env(safe-area-inset-bottom))" }}>
          <div className="font-semibold">Stay in the loop 🔔</div>
          <p className="mt-1 text-[14px] text-ink-soft">Get a heads-up when friends review a pro, someone joins your community, or you earn credits.</p>
          <div className="mt-3 flex justify-end gap-2"><button className="btn-ghost !py-2" onClick={() => { setAskPush(false); localStorage.setItem("wom_push_asked", "1"); }}>Not now</button><button className="btn-primary !py-2" onClick={enable}>Turn on</button></div>
        </div>
      )}
    </>
  );
}
