"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
export default function MarkRead() {
  useEffect(() => {
    const t = setTimeout(async () => { await createClient().rpc("mark_notifications_read"); window.dispatchEvent(new Event("wom:unread")); }, 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
