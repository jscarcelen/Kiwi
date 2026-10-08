"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toE164, validPhone } from "@/lib/phone";

export default function PhoneAuth({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const ref = sp.get("ref");
  const next = sp.get("next") || "/";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"enter" | "code">("enter");
  const [phone, setPhone] = useState(""); const [name, setName] = useState(""); const [code, setCode] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const s = createClient();

  if (!open) return <button type="button" className="btn-ghost w-full" onClick={() => setOpen(true)}>📱 Continue with phone</button>;

  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!validPhone(phone)) return setErr("Enter a valid phone number (include country code if outside the US).");
    if (mode === "signup" && !name.trim()) return setErr("Please enter your name.");
    setBusy(true);
    const { error } = await s.auth.signInWithOtp({ phone: toE164(phone), options: { shouldCreateUser: true, data: { full_name: name.trim() } } });
    setBusy(false);
    if (error) return setErr(error.message);
    setStep("code");
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const { data, error } = await s.auth.verifyOtp({ phone: toE164(phone), token: code.trim(), type: "sms" });
    if (error) { setBusy(false); return setErr(error.message); }
    if (data.user) await s.rpc("sync_my_phone");
    if (ref) await s.rpc("add_friend", { target: ref });
    router.push(mode === "signup" ? "/network?welcome=1" : next); router.refresh();
  };

  return (
    <div className="rounded-2xl bg-black/[0.03] p-4">
      {step === "enter" ? (
        <form className="space-y-3" onSubmit={send}>
          {mode === "signup" && <div><label className="label">Your name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>}
          <div><label className="label">Mobile number</label><input className="input" inputMode="tel" placeholder="(312) 555-0123" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          {err && <p className="text-[13px] text-red-600">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Text me a code"}</button>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={verify}>
          <p className="text-[14px] text-ink-soft">We texted a 6-digit code to {phone}.</p>
          <input className="input text-center text-xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          {err && <p className="text-[13px] text-red-600">{err}</p>}
          <button className="btn-primary w-full" disabled={busy || code.length < 6}>{busy ? "Verifying…" : "Verify & continue"}</button>
          <button type="button" className="w-full text-[13px] text-ink-soft" onClick={() => { setStep("enter"); setCode(""); }}>Use a different number</button>
        </form>
      )}
    </div>
  );
}
