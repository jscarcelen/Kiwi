"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function AddonCard({ id, title, desc, emoji, initial }: { id: string; title: string; desc: string; emoji: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="card p-6">
      <div className="text-3xl">{emoji}</div>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-[14px] text-ink-soft">{desc}</p>
      <button className={`mt-4 ${on ? "btn-primary" : "btn-ghost"} !py-2`} onClick={async () => {
        const s = createClient(); const { data } = await s.auth.getUser(); if (!data.user) return;
        if (on) await s.from("addon_interest").delete().eq("user_id", data.user.id).eq("addon", id);
        else await s.from("addon_interest").insert({ user_id: data.user.id, addon: id });
        setOn(!on);
      }}>{on ? "✓ You're on the waitlist" : "Join waitlist"}</button>
    </div>
  );
}
