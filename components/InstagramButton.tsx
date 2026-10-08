"use client";
import { useEffect, useState } from "react";
export default function InstagramButton() {
  const [msg, setMsg] = useState(false);
  const [native, setNative] = useState(false);
  useEffect(() => setNative(!!(window as any).Capacitor?.isNativePlatform?.()), []);
  if (native) return null; // App Store rule 4.8: no third-party login without Sign in with Apple
  return (
    <div>
      <button type="button" className="btn-ghost w-full" onClick={() => setMsg(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
        Continue with Instagram
      </button>
      {msg && <p className="mt-2 text-center text-[13px] text-ink-soft">Instagram contact sync is coming soon. For now, sign up with email and add your Instagram handle so friends can find you.</p>}
    </div>
  );
}
