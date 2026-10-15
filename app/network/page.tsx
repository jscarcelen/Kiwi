import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import NetworkManager from "@/components/NetworkManager";
import CommunitiesPanel from "@/components/CommunitiesPanel";
import ContactsFinder from "@/components/ContactsFinder";

/** Flip to true once phone verification (SMS) is set up: it shows the real contacts finder. */
const CONTACTS_AVAILABLE = false;
import CreditsCard from "@/components/CreditsCard";
import ShareBox from "@/components/ShareBox";
import { CREDIT_COMMUNITY, CREDIT_FRIEND, CREDIT_SUPPLIER } from "@/lib/referrals";

export const dynamic = "force-dynamic";

export default async function Network({ searchParams }: { searchParams: { welcome?: string } }) {
  const supabase = createClient();
  const { user, profile } = await getViewer(supabase);
  if (!user) redirect("/login?next=/network");
  const [{ data: conns }, { data: mem }, { data: groups }, { data: suggestions }, { data: refs }, { count: endorsed }] = await Promise.all([
    supabase.from("connections").select("friend:profiles!connections_friend_id_fkey(id,full_name,instagram)").eq("user_id", user.id),
    supabase.from("group_members").select("visible, groups(id,slug,name,description,owner_id,invite_code)").eq("user_id", user.id),
    supabase.from("groups").select("*").order("name"),
    supabase.rpc("suggested_friends"),
    supabase.from("referrals").select("kind,credits"),
    supabase.from("reviews").select("provider_id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const stats = {
    friends: (refs ?? []).filter((r: any) => r.kind === "friend").length,
    suppliers: (refs ?? []).filter((r: any) => r.kind === "supplier").length,
    members: (refs ?? []).filter((r: any) => r.kind === "community").length,
    credits: (refs ?? []).reduce((a: number, r: any) => a + r.credits, 0),
  };
  const friends = (conns ?? []).map((c: any) => c.friend).filter(Boolean);
  const allMine = (mem ?? []).map((m: any) => ({ ...m.groups, visible: m.visible }));
  const myGroups = allMine.filter((g: any) => !g.owner_id);
  const commIds = allMine.filter((g: any) => g.owner_id).map((g: any) => g.id);
  const { data: cm } = commIds.length ? await supabase.from("group_members").select("group_id").in("group_id", commIds) : { data: [] as any[] };
  const communities = allMine.filter((g: any) => g.owner_id).map((g: any) => ({ ...g, members: (cm ?? []).filter((x: any) => x.group_id === g.id).length }));
  const first = profile?.full_name?.split(" ")[0] ?? "";

  const tiles = [
    { n: friends.length, label: "Friends & connections", icon: "👥", href: "#friends" },
    { n: allMine.length, label: "Communities joined", icon: "⭐", href: "#communities" },
    { n: endorsed ?? 0, label: "Suppliers you've endorsed", icon: "✅", href: "/search?service=all" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{searchParams.welcome ? `Welcome, ${first}` : "My network"}</h1>
      <p className="mb-6 mt-1 text-ink-soft">Everything about your circle, invites and rewards in one place.</p>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card p-4 text-center transition hover:-translate-y-0.5 hover:shadow-pop sm:p-5">
            <div className="text-2xl">{t.icon}</div>
            <div className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{t.n}</div>
            <div className="mt-1 text-[12px] leading-tight text-ink-soft sm:text-[13px]">{t.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-4"><CreditsCard stats={stats} /></div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ShareBox
          icon="🤝" title="Connect with new people" tagline="Grow your circle so your recommendations get better."
          credit={`+${CREDIT_FRIEND} credit`}
          perks={[`+${CREDIT_FRIEND} credit for every friend who signs up with your link or QR`, `+${CREDIT_COMMUNITY} credit for every person who joins one of your communities`, "They're connected to you automatically"]}
          path={`/invite/${user.id}`} qrFile="wom-connect-qr.png" emailSubject="Join me on WOM"
          message="Join me on WOM — see which local pros our friends trust (cleaners, tutors, hair, movers & more): {link}"
        />
        <ShareBox
          icon="🛠️" title="Add a supplier" tagline="Know a great cleaner, tutor, stylist or mover? Bring them on."
          credit={`+${CREDIT_SUPPLIER} credits`} personalize
          perks={[`Triple reward: +${CREDIT_SUPPLIER} credits for every new supplier who signs up`, "You're recorded as their referrer", "They can refer other pros too"]}
          path={`/invite/${user.id}/pro`} qrFile="wom-supplier-qr.png" emailSubject="Join me on WOM as a pro"
          message={`{hi} I use WOM — a marketplace where people find local pros through recommendations from friends. I think you'd be a great fit. Sign up as a pro here (about a minute): {link}${first ? " — " + first : ""}. Heads up: I earn a referral credit if you join, and you can refer other pros too.`}
        />
      </div>

      <div id="friends" className="mt-10 scroll-mt-24"><NetworkManager me={user.id} friends={friends} myGroups={myGroups} allGroups={(groups ?? []).filter((g: any) => !g.owner_id)} suggestions={suggestions ?? []} /></div>
      <div className="scroll-mt-24"><CommunitiesPanel me={user.id} communities={communities} isPremium={!!profile?.is_premium} /></div>
      {CONTACTS_AVAILABLE ? (
        <ContactsFinder me={user.id} friendIds={friends.map((f: any) => f.id)} />
      ) : (
        <section className="card mt-8 p-6" aria-label="Find friends from your contacts (coming soon)">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">Find friends from your contacts</h2>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-700">Coming soon</span>
          </div>
          <p className="mt-1 text-[14px] text-ink-soft">Soon you&apos;ll be able to see which of your contacts are already on WOM, with a quick phone check. We match numbers on the spot and never store your contact list.</p>
          <p className="mt-3 text-[13px] text-ink-faint">Until then, share your invite link above — friends who join through it connect with you automatically.</p>
        </section>
      )}
      <p className="mt-6 text-center text-[13px] text-ink-faint"><Link href="/help" className="underline">Help: phone sign-in & importing contacts</Link> · <Link href="/settings" className="underline">Account settings</Link></p>
    </div>
  );
}
