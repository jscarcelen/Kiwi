import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import NetworkManager from "@/components/NetworkManager";
import DeleteAccount from "@/components/DeleteAccount";
import Link from "next/link";
import ContactsFinder from "@/components/ContactsFinder";

export const dynamic = "force-dynamic";

export default async function Network({ searchParams }: { searchParams: { welcome?: string } }) {
  const supabase = createClient();
  const { user, profile } = await getViewer(supabase);
  if (!user) redirect("/login?next=/network");
  const [{ data: conns }, { data: mem }, { data: groups }] = await Promise.all([
    supabase.from("connections").select("friend:profiles!connections_friend_id_fkey(id,full_name,instagram)").eq("user_id", user.id),
    supabase.from("group_members").select("visible, groups(id,slug,name,description)").eq("user_id", user.id),
    supabase.from("groups").select("*").order("name"),
  ]);
  const { data: suggestions } = await supabase.rpc("suggested_friends");
  const friends = (conns ?? []).map((c: any) => c.friend).filter(Boolean);
  const myGroups = (mem ?? []).map((m: any) => ({ ...m.groups, visible: m.visible }));
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">{searchParams.welcome ? `Welcome, ${profile?.full_name?.split(" ")[0] ?? ""} 🥝` : "My network"}</h1>
      <p className="mb-8 mt-1 text-ink-soft">The more people you connect, the better your recommendations.</p>
      <NetworkManager me={user.id} friends={friends} myGroups={myGroups} allGroups={groups ?? []} suggestions={suggestions ?? []} />
      <ContactsFinder me={user.id} friendIds={friends.map((f: any) => f.id)} />
      <p className="mt-6 text-center text-[13px] text-ink-faint"><Link href="/help" className="underline">Help: phone sign-in & importing contacts</Link> · <DeleteAccount /></p>
    </div>
  );
}
