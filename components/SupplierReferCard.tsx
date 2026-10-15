"use client";
import { useEffect, useState } from "react";
import { CREDIT_SUPPLIER } from "@/lib/referrals";

export default function SupplierReferCard({ me, firstName }: { me: string; firstName?: string }) {
  const [origin, setOrigin] = useState("");
  const [name, setName] = useState(""); const [contact, setContact] = useState("");
  const [copied, setCopied] = useState(false); const [canShare, setCanShare] = useState(false);
  useEffect(() => { setOrigin(window.location.origin); setCanShare(!!navigator.share); }, []);
  const link = `${origin}/invite/${me}/pro`;
  const isEmail = contact.includes("@");
  const digits = contact.replace(/\D/g, "");
  const msg = `Hi${name ? " " + name.split(" ")[0] : ""}! I use WOM — a marketplace where people find local pros through recommendations from friends. I think you'd be a great fit. Sign up as a pro here (takes about a minute): ${link}${firstName ? ` — ${firstName}` : ""}. Heads up: I earn a referral credit if you join, and you can refer other pros too.`;
  const btn = "btn-ghost !px-4 !py-2 !text-[14px]";
  return (
    <section id="refer-supplier" className="card p-6 sm:p-8">
      <p className="text-[13px] font-semibold text-brand-700">Refer a supplier · {CREDIT_SUPPLIER}× credit</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Know a great cleaner, tutor, stylist or mover?</h2>
      <p className="mt-2 max-w-2xl text-ink-soft">Send them a link to sign up directly on WOM. When they do, you're recorded as their referrer and earn triple credit — and they can start referring others too.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div><label className="label">Their name (optional)</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rosa" /></div>
        <div><label className="label">Their phone or email (optional)</label><input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="(312) 555-0123 or rosa@email.com" /></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <a className="btn-primary !px-5 !py-2 !text-[14px]" href={`https://wa.me/${!isEmail && digits.length >= 10 ? (digits.length === 10 ? "1" + digits : digits) : ""}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">WhatsApp</a>
        <a className={btn} href={`sms:${!isEmail ? digits : ""}?&body=${encodeURIComponent(msg)}`}>Messages</a>
        <a className={btn} href={`mailto:${isEmail ? contact : ""}?subject=${encodeURIComponent("Join me on WOM as a pro")}&body=${encodeURIComponent(msg)}`}>Email</a>
        {canShare && <button className={btn} onClick={() => navigator.share({ title: "Join WOM as a pro", text: msg, url: link }).catch(() => {})}>Share…</button>}
        <button className={btn} onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? "Copied ✓" : "Copy link"}</button>
      </div>
      <p className="mt-3 break-all text-[12px] text-ink-faint">{link}</p>
    </section>
  );
}
