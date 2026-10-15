"use client";
import { useState } from "react";

/** A password field with an eye button to show what you are typing. */
export default function PasswordInput({ value, onChange, minLength, required, placeholder, autoComplete, ariaLabel }: {
  value: string; onChange: (value: string) => void; minLength?: number; required?: boolean; placeholder?: string; autoComplete?: string; ariaLabel?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input className="input !pr-12" type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} minLength={minLength} required={required} placeholder={placeholder} autoComplete={autoComplete} aria-label={ariaLabel} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute inset-y-0 right-2 my-auto flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-black/5">
        {show ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17.94 17.94A10.5 10.5 0 0 1 12 20C5 20 1 12 1 12a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        )}
      </button>
    </div>
  );
}
