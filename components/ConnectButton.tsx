"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

const KINDS = [
  { id: "friend", label: "Friend", path: (me: string) => `/invite/${me}`, file: "wom-connect-qr.png",
    title: "Connect with a friend",
    how: "Have them scan this. Already on WOM → you're connected instantly. New → they sign up and are connected to you." },
  { id: "supplier", label: "Supplier", path: (me: string) => `/invite/${me}/pro`, file: "wom-supplier-qr.png",
    title: "Bring on a supplier",
    how: "Have a pro scan this. They sign up as a supplier with you recorded as their referrer, so you earn the supplier reward." },
] as const;

/** A plain "Connect" button: opens your QR code to scan in person — one for friends, one for suppliers. */
export default function ConnectButton({ me }: { me: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("friend");
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const k = KINDS.find((x) => x.id === kind)!;
  const link = `${origin}${k.path(me)}`;

  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => {
    if (!open || !origin) return;
    setQr(null);
    QRCode.toDataURL(link, { width: 720, margin: 2, color: { dark: "#051C2C", light: "#FFFFFF" } }).then(setQr);
  }, [open, origin, link]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1.5 font-semibold text-white hover:bg-navy/90" aria-haspopup="dialog">
        <span aria-hidden>▦</span><span>Connect</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div role="dialog" aria-label="Connect" className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Connect</h2>
              <button type="button" aria-label="Close" className="rounded-full px-2 py-1 text-ink-soft hover:bg-black/5" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-black/5 p-1" role="tablist">
              {KINDS.map((x) => (
                <button key={x.id} type="button" role="tab" aria-selected={kind === x.id} onClick={() => setKind(x.id)} className={`rounded-full py-2 text-[14px] font-semibold ${kind === x.id ? "bg-white shadow-sm" : "text-ink-soft"}`}>{x.label}</button>
              ))}
            </div>
            <p className="mt-4 text-[15px] font-semibold">{k.title}</p>
            <div className="mx-auto mt-3 aspect-square w-full max-w-[16rem]">
              {qr ? <img src={qr} alt={`QR code: ${k.title}`} className="h-full w-full rounded-2xl border border-black/10 bg-white" /> : <div className="h-full w-full animate-pulse rounded-2xl bg-black/5" />}
            </div>
            <p className="mt-3 text-[13px] text-ink-soft">{k.how}</p>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" className="btn-ghost !px-4 !py-2 !text-[13px]" onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>{copied ? "Copied ✓" : "Copy link"}</button>
              {qr && <a className="btn-ghost !px-4 !py-2 !text-[13px]" href={qr} download={k.file}>Download QR</a>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
