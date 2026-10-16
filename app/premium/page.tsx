import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import { fmtDate, getPremium, PREMIUM_FEATURES, PREMIUM_PRICE } from "@/lib/premium";
import PremiumCta from "@/components/PremiumCta";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Premium — WOM" };

export default async function PremiumPage() {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  const st = await getPremium(supabase);
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <span className="rounded-full bg-navy px-3 py-1 text-[12px] font-semibold text-white">PREMIUM</span>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Get more from your network</h1>
      <p className="mt-2 text-ink-soft">{st.started ? (st.paid ? "You're a Premium member — thank you." : "Unlock communities and saved filters.") : `Everything is free until ${fmtDate(st.start)}. After that, these features are part of Premium.`}</p>
      <div className="mt-8 space-y-3">{PREMIUM_FEATURES.map((f) => <div key={f.title} className="card flex gap-4 p-5"><div className="text-2xl">{f.icon}</div><div><b>{f.title}</b><p className="text-[14px] text-ink-soft">{f.body}</p></div></div>)}</div>
      <div className="card mt-6 grid gap-4 p-6 sm:grid-cols-2">
        <div><div className="text-[13px] text-ink-soft">Monthly</div><div className="text-3xl font-semibold">${PREMIUM_PRICE.month}<span className="text-base font-normal text-ink-soft">/mo</span></div></div>
        <div><div className="text-[13px] text-ink-soft">Yearly <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">best value</span></div><div className="text-3xl font-semibold">${PREMIUM_PRICE.year}<span className="text-base font-normal text-ink-soft">/yr</span></div></div>
      </div>
      {!st.paid && <div className="mt-6">{user ? <PremiumCta startLabel={fmtDate(st.start)} /> : <Link href="/signup" className="btn-primary w-full">Create a free account</Link>}</div>}
      <p className="mt-4 text-[13px] text-ink-faint">Earn free months by growing your network: every 5 referral credits = 1 month. <Link href="/network" className="underline">See your credits</Link></p>
    </div>
  );
}
