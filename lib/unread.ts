"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Unread in-app notification count (0 when signed out). Refreshes on the "wom:unread" event.
export function useUnread(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    const load = async () => {
      const s = createClient();
      const { data: u } = await s.auth.getUser();
      if (!u.user) return live && setN(0);
      const { data } = await s.rpc("unread_notifications");
      if (live) setN(typeof data === "number" ? data : 0);
    };
    load();
    window.addEventListener("wom:unread", load);
    const t = setInterval(load, 60000);
    return () => { live = false; window.removeEventListener("wom:unread", load); clearInterval(t); };
  }, []);
  return n;
}
