"use client";
import { createClient } from "@/lib/supabase/client";

export function sessionId(): string {
  try {
    let s = sessionStorage.getItem("wom_sid");
    if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem("wom_sid", s); }
    return s;
  } catch { return "anon"; }
}

export async function track(type: string, meta: Record<string, unknown> = {}, path?: string) {
  try {
    const s = createClient();
    const { data } = await s.auth.getUser();
    await s.from("app_events").insert({ type, user_id: data.user?.id ?? null, session_id: sessionId(), path: path ?? window.location.pathname, meta });
  } catch { /* analytics must never break the app */ }
}
