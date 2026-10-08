"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import InstagramButton from "./InstagramButton";
import PhoneAuth from "./PhoneAuth";

export default function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr("");
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) { setErr(error.message); setBusy(false); return; }
      router.push(next); router.refresh();
    }}>
      <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><label className="label">Password</label><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {err && <p className="text-[14px] text-red-600">{err}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <PhoneAuth mode="login" />
      <InstagramButton />
      <p className="text-center text-[13px] text-ink-faint"><Link href="/help" className="underline">How does phone sign-in work?</Link></p>
      <p className="text-center text-[14px] text-ink-soft">New to Kiwi? <Link className="font-semibold text-kiwi-700" href="/signup">Create an account</Link></p>
    </form>
  );
}
