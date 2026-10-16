import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import Link from "next/link";
import { fmtDate, getPremium } from "@/lib/premium";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings — WOM" };

export default async function Settings() {
  const supabase = createClient();
  const { user, profile } = await getViewer(supabase);
  if (!user) redirect("/login?next=/settings");
  const [{ data: phone }, { data: provider }] = await Promise.all([
    supabase.from("phone_numbers").select("phone,discoverable").eq("user_id", user.id).maybeSingle(),
    supabase.from("providers").select("*").eq("owner_id", user.id).order("created_at").limit(1).maybeSingle(),
  ]);
  const prem = await getPremium(supabase);
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
      <p className="mb-8 mt-1 text-ink-soft">Manage your profile, sign-in details, privacy and account.</p>
      <Link href="/premium" className="card mb-6 flex items-center justify-between p-5 hover:shadow-pop"><span><b>Premium</b><br /><span className="text-[14px] text-ink-soft">{prem.paid ? "Active — thank you!" : prem.started ? "Not active · unlock communities & saved filters" : `Free for everyone until ${fmtDate(prem.start)}`}</span></span><span className="text-brand-700">{prem.paid ? "View" : "Learn more"} →</span></Link>
      <SettingsForm user={{ id: user.id, email: user.email ?? "", phone: user.phone ?? "" }} profile={profile} phoneRow={phone} provider={provider} />
    </div>
  );
}
