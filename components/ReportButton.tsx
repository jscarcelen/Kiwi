"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REASONS = ["Spam or fake", "Offensive or abusive", "Harassment", "Inaccurate or misleading", "Inappropriate content", "Something else"];

export default function ReportButton({ type, id, authorId, signedIn, label = "Report", className = "" }: { type: "review" | "provider" | "user"; id: string; authorId?: string | null; signedIn: boolean; label?: string; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [more, setMore] = useState("");
  const [block, setBlock] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setErr("");
    const s = createClient();
    const { error } = await s.rpc("report_content", { ttype: type, tid: id, why: reason, more });
    if (error) { setBusy(false); return setErr(error.message); }
    if (block && authorId) await s.rpc("block_user", { target: authorId });
    setBusy(false); setDone(true); router.refresh();
  }
  const close = () => { setOpen(false); setDone(false); setReason(""); setMore(""); setBlock(false); };
  const click = () => { if (!signedIn) { router.push(`/login?next=${encodeURIComponent(location.pathname)}`); return; } setOpen(true); };

  return (
    <>
      <button type="button" onClick={click} className={`text-[12.5px] text-ink-faint hover:text-red-600 ${className}`}>{label}</button>
      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={close}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-ink shadow-pop" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <>
                <h3 className="text-lg font-semibold">Thanks — we'll review it</h3>
                <p className="mt-2 text-[14px] text-ink-soft">Our team reviews reports within 24 hours and removes content that breaks our rules.{block ? " The person is blocked, and you won't see their activity." : ""}</p>
                <button className="btn-primary mt-5 w-full !py-2.5" onClick={close}>Done</button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">Report {type === "review" ? "this review" : type === "provider" ? "this profile" : "this person"}</h3>
                <div className="mt-3 space-y-1.5">{REASONS.map((r) => <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[14px] ${reason === r ? "border-brand-600 bg-brand-50" : "border-black/10"}`}><input type="radio" name="why" checked={reason === r} onChange={() => setReason(r)} /> {r}</label>)}</div>
                <textarea rows={2} className="mt-3 w-full rounded-xl border border-black/10 px-3 py-2 text-[14px] outline-none" placeholder="Details (optional)" value={more} onChange={(e) => setMore(e.target.value)} />
                {authorId && <label className="mt-3 flex items-center gap-2 text-[14px]"><input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} /> Also block this person</label>}
                {err && <p className="mt-2 text-[13px] text-red-600">{err}</p>}
                <div className="mt-4 flex justify-end gap-2"><button className="btn-ghost !py-2" onClick={close}>Cancel</button><button className="btn-primary !py-2" disabled={!reason || busy} onClick={submit}>{busy ? "Sending…" : "Submit report"}</button></div>
              </>
            )}
          </div>
        </div>, document.body)}
    </>
  );
}
