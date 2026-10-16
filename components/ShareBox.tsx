"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { canShareNatively, isNative, shareNative } from "@/lib/native";

export default function ShareBox({ icon, title, tagline, credit, perks, path, qrFile, message, emailSubject, personalize = false }: {
  icon: string; title: string; tagline: string; credit: string; perks: string[]; path: string; qrFile: string;
  message: string; emailSubject: string; personalize?: boolean;
}) {
  const [origin, setOrigin] = useState(""); const [canShare, setCanShare] = useState(false);
  const [showQr, setShowQr] = useState(false); const [showLink, setShowLink] = useState(false);
  const [qr, setQr] = useState<string | null>(null); const [copied, setCopied] = useState(false);
  const [name, setName] = useState(""); const [contact, setContact] = useState("");
  useEffect(() => { setOrigin(window.location.origin); setCanShare(canShareNatively()); }, []);
  const link = `${origin}${path}`;
  useEffect(() => { if (showQr && origin) QRCode.toDataURL(link, { width: 640, margin: 2, color: { dark: "#051C2C", light: "#FFFFFF" } }).then(setQr); }, [showQr, origin, link]);
  const hi = name.trim() ? `Hi ${name.trim().split(" ")[0]}!` : "Hi!";
  const msg = message.replace("{hi}", hi).replace("{link}", link);
  const isEmail = contact.includes("@"); const digits = contact.replace(/\D/g, "");
  const wa = `https://wa.me/${personalize && !isEmail && digits.length >= 10 ? (digits.length === 10 ? "1" + digits : digits) : ""}?text=${encodeURIComponent(msg)}`;
  const sms = `sms:${personalize && !isEmail ? digits : ""}?&body=${encodeURIComponent(msg)}`;
  const mail = `mailto:${personalize && isEmail ? contact : ""}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msg)}`;
  const small = "btn-ghost !px-3.5 !py-1.5 !text-[13px]";
  return (
    <section className="card flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">{icon}</div>
        <span className="rounded-full bg-navy px-3 py-1 text-[13px] font-semibold text-white">{credit}</span>
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-[14px] text-ink-soft">{tagline}</p>
      <ul className="mt-3 space-y-1 text-[13px] text-ink-soft">{perks.map((p) => <li key={p}>✓ {p}</li>)}</ul>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button className={`btn ${showQr ? "bg-navy text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`} onClick={() => setShowQr(!showQr)}>▦ Share QR code</button>
        <button className={`btn ${showLink ? "bg-navy text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`} onClick={() => (isNative() && !personalize ? shareNative({ title: emailSubject, text: msg, url: link }) : setShowLink(!showLink))}>🔗 Share sign-up link</button>
      </div>

      {showQr && (
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-black/[0.03] p-4">
          {qr ? <img src={qr} alt="QR code" className="h-32 w-32 rounded-lg bg-white" /> : <div className="h-32 w-32 animate-pulse rounded-lg bg-black/5" />}
          <div className="text-[13px] text-ink-soft"><p>Let people scan this in person — at class, events or the office.</p>{qr && <a className={`${small} mt-2`} href={qr} download={qrFile}>Download QR</a>}</div>
        </div>
      )}
      {showLink && (
        <div className="mt-4 space-y-3 rounded-2xl bg-black/[0.03] p-4">
          {personalize && (
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="input !py-2 !text-[14px]" placeholder="Their name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="input !py-2 !text-[14px]" placeholder="Phone or email (optional)" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
          )}
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="input !py-2 !text-[13px]" aria-label="Sign-up link" />
          <div className="flex flex-wrap gap-2">
            <button className={small} onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>{copied ? "Copied ✓" : "Copy link"}</button>
            <a className={small} href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
            <a className={small} href={sms}>Messages</a>
            <a className={small} href={mail}>Email</a>
            {canShare && <button className={small} onClick={() => shareNative({ title: emailSubject, text: msg, url: link })}>Share…</button>}
          </div>
        </div>
      )}
    </section>
  );
}
