import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import AddProForm from "@/components/AddProForm";
import MyAddedPros from "@/components/MyAddedPros";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recommend a pro — WOM" };

export default async function AddPro({ searchParams }: { searchParams: { service?: string; city?: string } }) {
  const supabase = createClient();
  const { user, profile } = await getViewer(supabase);
  if (!user) redirect("/login?next=/add-pro");
  const { data: mine } = await supabase.rpc("my_added_pros");
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">Recommend a pro</h1>
      <p className="mb-8 mt-1 text-ink-soft">Know a great cleaner, tutor, stylist or mover? Add them with your rating — your friends and communities will see it first.</p>
      <AddProForm initialCategory={searchParams.service ?? ""} initialCity={searchParams.city ?? "Chicago"} myName={profile?.full_name ?? ""} />
      <MyAddedPros rows={(mine ?? []) as any[]} />
    </div>
  );
}
