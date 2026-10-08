import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import ReviewForm from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  if (!user) redirect(`/login?next=/review/${params.id}`);
  const { data: p } = await supabase.from("providers").select("id,company").eq("id", params.id).maybeSingle();
  if (!p) notFound();
  const { data: existing } = await supabase.from("reviews").select("rating,comment,share_with_friends").eq("provider_id", p.id).eq("user_id", user.id).maybeSingle();
  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Rate {p.company}</h1>
      <p className="mb-8 mt-1 text-ink-soft">Your feedback helps your friends choose well.</p>
      <div className="card p-7"><ReviewForm providerId={p.id} existing={existing} /></div>
    </div>
  );
}
