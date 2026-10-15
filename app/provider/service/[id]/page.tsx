import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import ServiceForm from "@/components/ServiceForm";

export const dynamic = "force-dynamic";

export default async function EditService({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  if (!user) redirect(`/login?next=/provider/service/${params.id}`);
  const { data: mine } = await supabase.from("providers").select("*").eq("owner_id", user.id).order("created_at");
  const listing = (mine ?? []).find((m: any) => m.id === params.id);
  if (!listing) notFound();
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href={`/provider/dashboard?listing=${listing.id}`} className="text-[14px] text-ink-soft hover:underline">← Dashboard</Link>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Edit service</h1>
      <p className="mb-8 mt-1 text-ink-soft">{listing.company}</p>
      <ServiceForm ownerId={user.id} listing={listing} canDelete={(mine ?? []).length > 1} base={{ contact_name: listing.contact_name, phone: listing.phone, email: listing.email, photo_url: listing.photo_url, city: listing.city, company: listing.company }} usedCategories={(mine ?? []).map((m: any) => m.category)} />
    </div>
  );
}
