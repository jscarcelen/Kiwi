import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import ServiceForm from "@/components/ServiceForm";

export const dynamic = "force-dynamic";

export default async function NewService() {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  if (!user) redirect("/login?next=/provider/service/new");
  const { data: mine } = await supabase.from("providers").select("*").eq("owner_id", user.id).order("created_at");
  if (!mine?.length) redirect("/provider/signup");
  const first = mine[0];
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/provider/dashboard" className="text-[14px] text-ink-soft hover:underline">← Dashboard</Link>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Add another service</h1>
      <p className="mb-8 mt-1 text-ink-soft">Offer something else under the same account — like cleaning and dog walking. Each service gets its own listing, searches and reviews.</p>
      <ServiceForm ownerId={user.id} base={{ contact_name: first.contact_name, phone: first.phone, email: first.email, photo_url: first.photo_url, city: first.city, company: first.company }} usedCategories={mine.map((m: any) => m.category)} />
    </div>
  );
}
