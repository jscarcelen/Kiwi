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
  const name = p?.full_name?.split(" ")[0] ?? "A friend";
  return { title: `${name} invited you to WOM`, description: "See which local pros your friends trust — cleaners, tutors, hair, movers and more." };
}

export default async function Invite({ params }: { params: { id: string } }) {
  const p = await inviter(params.id);
  if (!p) notFound();
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  const first = p.full_name?.split(" ")[0] || "A friend";
  const self = user?.id === p.id;
  if (user && !self) await supabase.rpc("add_friend", { target: p.id });

  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <div className="flex justify-center"><Avatar id={p.id} name={p.full_name} size={72} /></div>
      {user ? (
        <>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">{self ? "This is your invite link" : `You're now connected with ${first}`}</h1>
          <p className="mt-2 text-ink-soft">{self ? "Share it with friends so they join your network." : `You'll see the pros ${first} recommends first.`}</p>
          <Link href={self ? "/network" : "/"} className="btn-primary mt-8">{self ? "Go to my network" : "Find a pro"}</Link>
        </>
      ) : (
        <>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">{first} invited you to WOM</h1>
          <p className="mt-2 text-ink-soft">Find cleaners, tutors, hair stylists, movers and more — rated by people you know, not strangers. Join and you'll be connected with {first} right away.</p>
          <Link href={`/signup?ref=${p.id}`} className="btn-primary mt-8 w-full">Join WOM</Link>
          <p className="mt-4 text-[14px] text-ink-soft">Already a member? <Link className="font-semibold text-brand-700" href={`/login?next=/invite/${p.id}`}>Sign in</Link></p>
        </>
      )}
    </div>
  );
}
