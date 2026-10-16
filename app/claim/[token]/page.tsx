import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import { catEmoji, catLabel } from "@/lib/categories";
import ClaimButton from "@/components/ClaimButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claim your profile — WOM", robots: { index: false, follow: false } };

export default async function Claim({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  const { data: pv } = await supabase.rpc("claim_preview", { tok: params.token });
  if (!pv) return <div className="mx-auto max-w-md px-5 py-24 text-center"><h1 className="text-2xl font-semibold">Link not found</h1><p className="mt-2 text-ink-soft">This claim link isn't valid anymore.</p></div>;
  const next = `/claim/${params.token}`;
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="card p-7 text-center">
        <div className="text-4xl">{catEmoji(pv.category)}</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{pv.company}</h1>
        <p className="text-ink-soft">{catLabel(pv.category)} · {pv.city}</p>
        <p className="mt-4 text-[15px] text-ink-soft"><b>{pv.adder}</b> recommended you on WOM{pv.ratings > 1 ? ` and ${pv.ratings - 1} other${pv.ratings > 2 ? "s" : ""} rated you` : ""}. Claim this free profile to add your photo, services and contact details, and get found by people in their network.</p>
        {!pv.unclaimed ? <p className="mt-6 rounded-xl bg-black/[0.04] p-3 text-[14px]">This profile has already been claimed.</p>
          : user ? <div className="mt-6"><ClaimButton token={params.token} /></div>
          : <div className="mt-6 grid gap-2"><Link className="btn-primary" href={`/signup?next=${encodeURIComponent(next)}`}>Create a free account</Link><Link className="btn-ghost" href={`/login?next=${encodeURIComponent(next)}`}>I already have an account</Link></div>}
        <p className="mt-5 text-[12.5px] text-ink-faint">Not you or don't want a profile? Contact us via the Feedback button and we'll remove it.</p>
      </div>
    </div>
  );
}
