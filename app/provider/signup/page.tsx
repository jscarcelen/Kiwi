import ProviderSignupForm from "@/components/ProviderSignupForm";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProviderSignup({ searchParams }: { searchParams: { ref?: string } }) {
  const ref = searchParams.ref && UUID.test(searchParams.ref) ? searchParams.ref : undefined;
  const referrer = ref ? (await createClient().from("profiles").select("full_name").eq("id", ref).maybeSingle()).data : null;
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="text-center text-4xl font-semibold tracking-tight">List your business on WOM</h1>
      <p className="mt-2 text-center text-ink-soft">Takes about a minute. Customers find you through friends who already trust you.</p>
      {referrer && <p className="mx-auto mt-5 max-w-md rounded-xl bg-brand-50 p-3 text-center text-[14px] text-brand-700">Recommended by <b>{referrer.full_name}</b> 🙌</p>}
      <div className="card mt-8 p-7"><ProviderSignupForm refId={ref} /></div>
    </div>
  );
}
