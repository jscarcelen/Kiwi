"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContactButton({ providerId, phone: p0, email: e0, unclaimed = false, adder = "your friend" }: { providerId: string; phone?: string; email?: string; unclaimed?: boolean; adder?: string }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(p0); const [email, setEmail] = useState(e0);
  return open ? (
    <div className="rounded-2xl bg-brand-50 p-4 text-[15px]">
      {phone && <div><b>Phone:</b> <a className="text-brand-700 underline" href={`tel:${phone}`}>{phone}</a></div>}
      {email && <div className="mt-1"><b>Email:</b> <a className="text-brand-700 underline" href={`mailto:${email}`}>{email}</a></div>}
      {unclaimed && !phone && !email && <div className="text-ink-soft">This pro hasn't joined WOM yet and no contact details were shared with you. Ask {adder} for an intro.</div>}
    </div>
  ) : (
    <button className="btn-primary w-full" onClick={async () => {
      const s = createClient();
      if (unclaimed) { const { data: c } = await s.rpc("provider_contact", { pid: providerId }); setPhone(c?.phone ?? undefined); setEmail(c?.email ?? undefined); }
      setOpen(true);
      const { data } = await s.auth.getUser();
      await s.from("provider_events").insert({ provider_id: providerId, type: "contact", user_id: data.user?.id ?? null });
    }}>Contact provider</button>
  );
}
