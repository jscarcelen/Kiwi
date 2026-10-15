"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function InviteCard({ me, firstName, banner }: { me: string; firstName?: string; banner?: React.ReactNode }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  useEffect(() => { setOrigin(window.location.origin); setCanShare(!!navigator.share); }, []);
  const link = `${origin}/invite/${me}`;
  useEffect(() => { if (showQr && origin) QRCode.toDataURL(link, { width: 640, margin: 2, errorCorrectionLevel: "M", color: { dark: "#051C2C", light: "#FFFFFF" } }).then(setQr); }, [showQr, origin, link]);
  const msg = `Join me on WOM — see which local pros our friends trust (cleaners, tutors, hair, movers & more): ${link}`;
  const copy = async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const btn = "btn-ghost !px-4 !py-2 !text-[14px]";
  return (
    <section id="invite" className="rounded-2xl bg-navy p-6 text-white sm:p-8">
      <p className="text-[13px] font-semibold text-brand-200">Step 1 · Invite your friends</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{firstName ? `${firstName}, ` : ""}the more friends you add, the better your recommendations.</h2>
      <p className="mt-2 max-w-2xl text-white/70">Send your personal link. Anyone who joins through it is connected to you automatically — no contacts needed. Share it in your class or friends' group chat.</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-full bg-white/10 px-5 py-3 text-[14px] text-white outline-none ring-1 ring-white/20" aria-label="Your invite link" />
        <button className="btn-light shrink-0" onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-ink">
        {canShare && <button className={btn} onClick={() => navigator.share({ title: "Join me on WOM", text: msg, url: link }).catch(() => {})}>Share…</button>}
        <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">WhatsApp</a>
        <a className={btn} href={`sms:?&body=${encodeURIComponent(msg)}`}>Messages</a>
        <button className={btn} onClick={() => setShowQr(!showQr)}>{showQr ? "Hide QR" : "Show QR"}</button>
        <a className={btn} href={`mailto:?subject=${encodeURIComponent("Join me on WOM")}&body=${encodeURIComponent(msg)}`}>Email</a>
      </div>
      {banner && <div className="mt-6 text-white">{banner}</div>}
      {showQr && (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-ink sm:flex-row sm:gap-6">
          {qr ? <img src={qr} alt="QR code to connect with you" className="h-44 w-44" /> : <div className="h-44 w-44 animate-pulse rounded-xl bg-black/5" />}
          <div className="text-center sm:text-left">
            <p className="font-semibold">Scan to connect{firstName ? ` with ${firstName}` : ""}</p>
            <p className="mt-1 text-[14px] text-ink-soft">Show this at events or in class. Anyone who scans it can join WOM and is connected to you instantly.</p>
            {qr && <a className="btn-ghost mt-3 !py-2 !text-[14px]" href={qr} download="wom-connect-qr.png">Download QR</a>}
          </div>
        </div>
      )}
    </section>
  );
}
