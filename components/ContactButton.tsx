"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContactButton({ providerId, phone, email }: { providerId: string; phone?: string; email?: string }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <div className="rounded-2xl bg-kiwi-50 p-4 text-[15px]">
      {phone && <div><b>Phone:</b> <a className="text-kiwi-700 underline" href={`tel:${phone}`}>{phone}</a></div>}
      {email && <div className="mt-1"><b>Email:</b> <a className="text-kiwi-700 underline" href={`mailto:${email}`}>{email}</a></div>}
    </div>
  ) : (
    <button className="btn-primary w-full" onClick={async () => {
      setOpen(true);
      const s = createClient();
      const { data } = await s.auth.getUser();
      await s.from("provider_events").insert({ provider_id: providerId, type: "contact", user_id: data.user?.id ?? null });
    }}>Contact provider</button>
  );
}
