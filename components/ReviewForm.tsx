"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReviewForm({ providerId, existing }: { providerId: string; existing?: { rating: number; comment: string; share_with_friends: boolean } | null }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [share, setShare] = useState(existing?.share_with_friends ?? true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setErr("Please choose a rating.");
    setBusy(true); setErr("");
    const s = createClient();
    const { data } = await s.auth.getUser();
    if (!data.user) return router.push(`/login?next=/review/${providerId}`);
    const { error } = await s.from("reviews").upsert({ provider_id: providerId, user_id: data.user.id, rating, comment, share_with_friends: share }, { onConflict: "provider_id,user_id" });
    if (error) { setErr(error.message); setBusy(false); return; }
    router.push(`/providers/${providerId}`); router.refresh();
  };
  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <span className="label">How was your experience?</span>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button type="button" key={i} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)} aria-label={`${i} stars`}>
              <svg width="40" height="40" viewBox="0 0 20 20" fill="currentColor" className={(hover || rating) >= i ? "text-amber-400" : "text-black/15"}><path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L10 14.9l-5.3 2.8 1.1-5.9L1.5 7.7l5.9-.8L10 1.5z" /></svg>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Comments (optional)</label>
        <textarea className="input min-h-[120px]" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What would you tell a friend?" />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-kiwi-50 p-4">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-kiwi-600" checked={share} onChange={(e) => setShare(e.target.checked)} />
        <span className="text-[15px]"><b>Share with my friends & groups</b><br /><span className="text-ink-soft">Your name and review will be visible to your contacts. If off, only your rating counts toward the anonymous overall score.</span></span>
      </label>
      {err && <p className="text-[14px] text-red-600">{err}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Submit review"}</button>
    </form>
  );
}
