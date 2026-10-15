import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import { Avatar } from "@/components/ui";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function inviter(id: string) {
  if (!UUID.test(id)) return null;
  const { data } = await createClient().from("profiles").select("id,full_name").eq("id", id).maybeSingle();
  return data;
}
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await inviter(params.id);
  return { title: `${p?.full_name?.split(" ")[0] ?? "A customer"} invited you to join WOM as a pro`, description: "Get found by customers whose friends already recommend you. Free to list." };
}

export default async function ProInvite({ params }: { params: { id: string } }) {
  const p = await inviter(params.id);
  if (!p) notFound();
  const { user, profile } = await getViewer(createClient());
  const first = p.full_name?.split(" ")[0] || "A customer";
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <div className="flex justify-center"><Avatar id={p.id} name={p.full_name} size={72} /></div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{first} thinks you'd be a great pro on WOM</h1>
      <p className="mt-2 text-ink-soft">WOM connects customers with pros their friends already trust. Create your free profile in about a minute and get discovered through word of mouth.</p>
      {user && profile?.is_provider ? (
        <Link href="/provider/dashboard" className="btn-primary mt-8 w-full">You're already a pro — open dashboard</Link>
      ) : (
        <Link href={`/provider/signup?ref=${p.id}`} className="btn-primary mt-8 w-full">Join as a pro</Link>
      )}
      <p className="mt-4 text-[13px] text-ink-faint">{first} will receive a referral credit when you join.</p>
    </div>
  );
}
