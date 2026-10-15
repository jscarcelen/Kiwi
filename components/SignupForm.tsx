"use client";
import PasswordInput from "./PasswordInput";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import InstagramButton from "./InstagramButton";
import PhoneAuth from "./PhoneAuth";

export default function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const ref = sp.get("ref");
  const community = sp.get("community");
  const [f, setF] = useState({ full_name: "", email: "", password: "", confirm: "", phone: "", instagram: "" });
  const [err, setErr] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setErr("");
      if (f.password !== f.confirm) { setErr("The two passwords don't match."); return; }
      setBusy(true);
      const s = createClient();
      const { data, error } = await s.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.full_name, phone: f.phone, instagram: f.instagram.replace("@", ""), ...(ref ? { ref } : {}), ...(community ? { community } : {}) } } });
      if (error) { setErr(error.message); setBusy(false); return; }
      if (!data.session) { setNote("Check your email to confirm your account, then sign in."); setBusy(false); return; }
      if (ref) await s.rpc("add_friend", { target: ref });
      router.push("/network?welcome=1"); router.refresh();
    }}>
      {ref && <p className="rounded-xl bg-brand-50 p-3 text-[14px] text-brand-700">You were invited by a friend — you'll be connected automatically.</p>}
      {community && <p className="rounded-xl bg-brand-50 p-3 text-[14px] text-brand-700">You're joining a WOM community — you'll be added automatically.</p>}
      <div><label className="label">Full name</label><input className="input" required value={f.full_name} onChange={set("full_name")} /></div>
      <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={set("email")} placeholder="Use your @chicagobooth.edu email to join Booth" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Password</label><PasswordInput minLength={6} required value={f.password} onChange={(v) => setF({ ...f, password: v })} autoComplete="new-password" /></div>
        <div><label className="label">Confirm password</label><PasswordInput minLength={6} required value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} autoComplete="new-password" ariaLabel="Confirm password" />{f.confirm && f.confirm !== f.password && <p className="mt-1 text-[12px] text-red-600">Doesn't match yet</p>}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Phone (optional)</label><input className="input" value={f.phone} onChange={set("phone")} /></div>
        <div><label className="label">Instagram (optional)</label><input className="input" placeholder="@handle" value={f.instagram} onChange={set("instagram")} /></div>
      </div>
      {err && <p className="text-[14px] text-red-600">{err}</p>}
      {note && <p className="rounded-xl bg-brand-50 p-3 text-[14px] text-brand-700">{note}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      <PhoneAuth mode="signup" />
      <InstagramButton />
      <p className="text-center text-[13px] text-ink-faint"><Link href="/help" className="underline">How does phone sign-in work?</Link></p>
      <p className="text-center text-[14px] text-ink-soft">Already have an account? <Link className="font-semibold text-brand-700" href="/login">Sign in</Link></p>
    </form>
  );
}
