"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { icon: "💬", title: "Tell WOM what you need", body: "Type it in your own words — “deep clean before I move out”, “GMAT tutor”, “balayage and a haircut”. Our assistant understands it, suggests services as you type, and asks a few quick questions." },
  { icon: "👥", title: "See who your friends trust", body: "Results are ranked by ratings from people in your network first, then everyone else. Narrow them to just your friends, or to a community like Booth, with one tap." },
  { icon: "🔗", title: "Build your network", body: "Invite friends with your personal link or QR code, find people from your contacts, or join verified groups. Everyone who joins through you is connected to you automatically." },
  { icon: "⭐", title: "Start a community", body: "Create a community — “Latin Booth”, your running club, your building — share its link and become its ambassador. Three are free; Premium unlocks more." },
  { icon: "🎁", title: "Earn rewards", body: "1 credit for every friend who joins, 1 for every community member, and triple — 3 credits — for every new supplier you refer (friend & supplier bonus until December 1). Every 5 credits = 1 free month of Premium, plus cashback on the premium features coming soon." },
  { icon: "✅", title: "Message pros and leave ratings", body: "Send your project to your top 3 matches in one tap. After the job, rate your pro so your friends can find the good ones too — you choose whether to share your name." },
  { icon: "🛠️", title: "Are you a pro?", body: "Join free, get discovered through word of mouth, see who's viewing your profile, and refer other pros to earn triple credit." },
];

export default function TourHost() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const start = () => { setI(0); setOpen(true); };
  const close = () => { setOpen(false); try { localStorage.setItem("wom_tour_seen", "1"); } catch {} };

  useEffect(() => {
    const h = () => start();
    window.addEventListener("wom:tour", h);
    // auto-show once after first login
    (async () => {
      try { if (localStorage.getItem("wom_tour_seen")) return; } catch { return; }
      const { data } = await createClient().auth.getUser();
      if (data.user) setTimeout(start, 900);
    })();
    return () => window.removeEventListener("wom:tour", h);
  }, []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, STEPS.length - 1)); if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0)); };
    window.addEventListener("keydown", k);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", k); };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  const s = STEPS[i]; const last = i === STEPS.length - 1;
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/55 text-ink sm:items-center sm:p-6" onClick={close}>
      <div className="w-full overflow-hidden rounded-t-3xl bg-white shadow-pop sm:max-w-md sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="text-[13px] font-semibold text-brand-700">How WOM works · {i + 1}/{STEPS.length}</span>
          <button onClick={close} className="rounded-full p-1.5 text-ink-soft hover:bg-black/5" aria-label="Close">✕</button>
        </div>
        <div className="px-6 pb-2 pt-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-5xl">{s.icon}</div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">{s.title}</h2>
          <p className="mt-2 min-h-[120px] text-[15px] leading-relaxed text-ink-soft">{s.body}</p>
        </div>
        <div className="flex justify-center gap-1.5 pb-4">{STEPS.map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`Step ${k + 1}`} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-navy" : "w-1.5 bg-black/15"}`} />)}</div>
        <div className="flex items-center justify-between gap-3 border-t border-black/5 px-6 py-4">
          <button className="text-[14px] font-medium text-ink-soft" onClick={i === 0 ? close : () => setI(i - 1)}>{i === 0 ? "Skip" : "Back"}</button>
          <button className="btn-primary !px-8" onClick={last ? close : () => setI(i + 1)}>{last ? "Get started" : "Next"}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
