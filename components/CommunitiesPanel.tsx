"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { FREE_COMMUNITY_LIMIT } from "@/lib/referrals";

export type Community = { id: string; slug: string; name: string; description: string | null; owner_id: string | null; invite_code: string; visible: boolean; members: number };

export default function CommunitiesPanel({ me, communities, isPremium }: { me: string; communities: Community[]; isPremium: boolean }) {
  const router = useRouter();
  const s = createClient();
  const [origin, setOrigin] = useState("");
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<{ id: string; url: string } | null>(null);
  const [copied, setCopied] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const owned = communities.filter((c) => c.owner_id === me);
  const used = owned.length;
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const { data, error } = await s.rpc("create_community", { cname: name, cdesc: desc });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data?.error) return setErr(data.error);
    setName(""); setDesc(""); setOpen(false); router.refresh();
  };
  const link = (c: Community) => `${origin}/c/${c.invite_code}`;
  const msg = (c: Community) => `Join "${c.name}" on WOM — trusted pros recommended by our community: ${link(c)}`;
  const showQr = async (c: Community) => setQr(qr?.id === c.id ? null : { id: c.id, url: await QRCode.toDataURL(link(c), { width: 560, margin: 2, color: { dark: "#051C2C", light: "#FFFFFF" } }) });
  const btn = "btn-ghost !px-3.5 !py-1.5 !text-[13px]";

  return (
    <section id="communities" className="card mt-8 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">Communities <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">PLUS</span></h2>
          <p className="mt-1 max-w-2xl text-[14px] text-ink-soft">Create your own — “Booth 2028”, “Latin Booth”, your running club — and share the link. You become its <b>ambassador</b>. Filter any search by a community to see only its members' reviews.</p>
        </div>
        <div className="text-right text-[13px] text-ink-soft">
          <div className="font-semibold text-ink">{isPremium ? `${used} communities · Premium` : `${used} of ${FREE_COMMUNITY_LIMIT} free communities`}</div>
          {!isPremium && <div>Premium (soon) = unlimited. Earn free months by growing your network.</div>}
        </div>
      </div>

      {open ? (
        <form onSubmit={create} className="mt-5 space-y-3 rounded-2xl bg-black/[0.03] p-4">
          <div><label className="label">Community name</label><input className="input" required minLength={3} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Latin Booth" /></div>
          <div><label className="label">Short description (optional)</label><input className="input" maxLength={140} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Who is this community for?" /></div>
          {err && <p className="text-[13px] text-red-600">{err}</p>}
          <div className="flex gap-2"><button className="btn-primary !py-2" disabled={busy}>{busy ? "Creating…" : "Create community"}</button><button type="button" className="btn-ghost !py-2" onClick={() => setOpen(false)}>Cancel</button></div>
        </form>
      ) : (
        <button className="btn-primary mt-5" onClick={() => { setOpen(true); setErr(""); }}>+ Create a community</button>
      )}
      {!open && err && <p className="mt-2 text-[13px] text-red-600">{err}</p>}

      <div className="mt-6 space-y-3">
        {communities.length === 0 && <p className="text-ink-soft">No communities yet. Create one, or join one through a friend's link.</p>}
        {communities.map((c) => {
          const mine = c.owner_id === me;
          return (
            <div key={c.id} className="rounded-2xl border border-black/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold">{c.name}{mine && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">★ Ambassador</span>}</h3>
                  {c.description && <p className="text-[14px] text-ink-soft">{c.description}</p>}
                  <p className="mt-1 text-[13px] text-ink-faint">{c.members} member{c.members === 1 ? "" : "s"}</p>
                </div>
                <Link className={btn} href={`/search?service=all&circle=${c.slug}`}>See their picks →</Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className={btn} onClick={async () => { await navigator.clipboard.writeText(link(c)); setCopied(c.id); setTimeout(() => setCopied(""), 1800); }}>{copied === c.id ? "Copied ✓" : "Copy invite link"}</button>
                <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(msg(c))}`} target="_blank" rel="noreferrer">WhatsApp</a>
                <a className={btn} href={`sms:?&body=${encodeURIComponent(msg(c))}`}>Messages</a>
                <button className={btn} onClick={() => showQr(c)}>{qr?.id === c.id ? "Hide QR" : "QR"}</button>
                {mine ? (
                  <>
                    <button className={btn} onClick={async () => { if (!confirm("Create a new invite link? The old link will stop working.")) return; await s.rpc("regenerate_invite", { gid: c.id }); router.refresh(); }}>New link</button>
                    <button className={`${btn} !text-red-600`} onClick={async () => { if (!confirm(`Delete "${c.name}"? Members will lose access to it.`)) return; await s.from("groups").delete().eq("id", c.id); router.refresh(); }}>Delete</button>
                  </>
                ) : (
                  <button className={btn} onClick={async () => { await s.from("group_members").delete().eq("group_id", c.id).eq("user_id", me); router.refresh(); }}>Leave</button>
                )}
              </div>
              <label className="mt-3 flex items-center gap-2 text-[13px]"><input type="checkbox" className="accent-brand-500" checked={c.visible} onChange={async (e) => { await s.from("group_members").update({ visible: e.target.checked }).eq("group_id", c.id).eq("user_id", me); router.refresh(); }} /> Share my reviews with this community</label>
              {qr?.id === c.id && <div className="mt-4 flex items-center gap-4"><img src={qr.url} alt="Community QR" className="h-40 w-40 rounded-xl ring-1 ring-black/10" /><a className={btn} href={qr.url} download={`wom-${c.slug}-qr.png`}>Download QR</a></div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
