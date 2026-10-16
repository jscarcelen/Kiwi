"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isNative } from "@/lib/native";
import { track } from "@/lib/track";
import { PREMIUM_FEATURES, PREMIUM_PRICE } from "@/lib/premium";

// Paste the Paddle hosted checkout link into NEXT_PUBLIC_PADDLE_CHECKOUT_URL when the Paddle account is live.
const CHECKOUT = process.env.NEXT_PUBLIC_PADDLE_CHECKOUT_URL;

export default function UpgradeModal({ open, onClose, feature, startLabel }: { open: boolean; onClose: () => void; feature: string; startLabel: string }) {
  const [native, setNative] = useState(false);
  const [noted, setNoted] = useState(false);
  useEffect(() => setNative(isNative()), []);
  useEffect(() => { if (open) track("limit_hit", { feature }); }, [open, feature]);
  if (!open) return null;
  const notify = async () => {
    const s = createClient(); const { data } = await s.auth.getUser();
    if (data.user) await s.from("addon_interest").upsert({ user_id: data.user.id, addon: "premium" });
    setNoted(true);
  };
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-ink shadow-pop" onClick={(e) => e.stopPropagation()}>
        <span className="rounded-full bg-navy px-3 py-1 text-[12px] font-semibold text-white">PREMIUM</span>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">Unlock {feature}</h3>
        <ul className="mt-4 space-y-3">{PREMIUM_FEATURES.map((f) => <li key={f.title} className="flex gap-3 text-[14px]"><span className="text-xl">{f.icon}</span><span><b>{f.title}</b><br /><span className="text-ink-soft">{f.body}</span></span></li>)}</ul>
        <p className="mt-4 text-[14px] text-ink-soft">${PREMIUM_PRICE.month}/month or ${PREMIUM_PRICE.year}/year. Premium opens up on {startLabel}.</p>
        {native ? (
          <p className="mt-4 rounded-xl bg-black/[0.04] p-3 text-[13px] text-ink-soft">Premium isn't available to purchase in the app yet.</p>
        ) : CHECKOUT ? (
          <a href={CHECKOUT} className="btn-primary mt-4 w-full">Upgrade to Premium</a>
        ) : (
          <button className="btn-primary mt-4 w-full" disabled={noted} onClick={notify}>{noted ? "✓ We'll let you know" : "Notify me when Premium launches"}</button>
        )}
        <div className="mt-3 flex justify-between text-[13px]"><Link href="/premium" className="text-brand-700 hover:underline" onClick={onClose}>See what's included</Link><button className="text-ink-faint hover:underline" onClick={onClose}>Not now</button></div>
      </div>
    </div>, document.body);
}
