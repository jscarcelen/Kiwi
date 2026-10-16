import type { SupabaseClient } from "@supabase/supabase-js";

export type PremiumStatus = { start: string; started: boolean; paid: boolean; has_premium: boolean };
export const PREMIUM_PRICE = { month: 2.5, year: 24 };
export const PREMIUM_FEATURES = [
  { icon: "👥", title: "Unlimited communities", body: "Create as many communities as you like and filter ratings by each. Free accounts get 3." },
  { icon: "🔖", title: "Saved filters", body: "Save any search — city, service and answers — and reopen it in one tap." },
  { icon: "🎁", title: "Credits become free months", body: "Every 5 referral credits turn into a free Premium month." },
];

export async function getPremium(supabase: SupabaseClient): Promise<PremiumStatus> {
  const { data } = await supabase.rpc("premium_status");
  return (data as PremiumStatus) ?? { start: "2027-01-01", started: false, paid: false, has_premium: false };
}
export const fmtDate = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
