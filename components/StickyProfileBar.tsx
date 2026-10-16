"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Always-visible Contact / Rate bar on pro profiles (phones & tablets). Contact opens a sheet with the details.
export default function StickyProfileBar({ providerId, company, phone: p0, email: e0, unclaimed = false, adder = "your friend", rateHref, rated }: { providerId: string; company: string; phone?: string | null; email?: string | null; unclaimed?: boolean; adder?: string; rateHref: string; rated: boolean }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState<string | undefined>(p0 ?? undefined); const [email, setEmail] = useState<string | undefined>(e0 ?? undefined);
  const [loaded, setLoaded] = useState(false);
  const show = async () => {
    setOpen(true);
    const s = createClient();
    if (unclaimed && !loaded) { const { data: c } = await s.rpc("provider_contact", { pid: providerId }); setPhone(c?.phone ?? undefined); setEmail(c?.email ?? undefined); setLoaded(true); }
    const { data } = await s.auth.getUser();
    await s.from("provider_events").insert({ provider_id: providerId, type: "contact", user_id: data.user?.id ?? null });
  };
  const btn = "flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[16px] font-semibold";
  return (
    <>
      <div className="profile-bar fixed inset-x-0 z-[2147481000] border-t border-black/10 bg-white/95 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2.5">
          <button onClick={show} className="btn-primary flex-1 !py-3.5 !text-[16px]">Contact</button>
          <Link href={rateHref} className="btn-ghost !py-3.5 !text-[16px]">{rated ? "Edit review" : "Rate"}</Link>
        </div>
      </div>
      {open && createPortal(
        <div className="fixed inset-0 z-[2147482500] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-ink shadow-pop sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15 sm:hidden" />
            <h3 className="text-xl font-semibold tracking-tight">Contact {company}</h3>
            <div className="mt-4 space-y-2.5">
              {phone && <a className={btn} href={`tel:${phone}`}>📞 Call {phone}</a>}
              {phone && <a className={btn} href={`sms:${phone}`}>💬 Text</a>}
              {email && <a className={btn} href={`mailto:${email}`}>✉️ Email</a>}
              {!phone && !email && <p className="rounded-xl bg-black/[0.04] p-3 text-[14px] text-ink-soft">{unclaimed ? `This pro hasn't joined WOM yet and no contact details were shared with you. Ask ${adder} for an intro.` : "This pro hasn't added contact details yet."}</p>}
            </div>
            <button className="mt-4 w-full py-2 text-[14px] text-ink-faint" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>, document.body)}
    </>
  );
}
