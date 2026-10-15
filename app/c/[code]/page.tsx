import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import JoinCommunity from "@/components/JoinCommunity";
import { LogoMark } from "@/components/Logo";

export const dynamic = "force-dynamic";

async function load(code: string) {
  if (!/^[a-z0-9]{6,20}$/i.test(code)) return null;
  const { data } = await createClient().rpc("community_preview", { code });
  return Array.isArray(data) ? data[0] ?? null : null;
}
export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const c = await load(params.code);
  return { title: c ? `Join ${c.name} on WOM` : "WOM community", description: c ? `${c.owner_name ?? "A member"} invited you. See which pros ${c.name} recommends.` : undefined };
}

export default async function CommunityPage({ params }: { params: { code: string } }) {
  const c = await load(params.code);
  if (!c) notFound();
  const { user } = await getViewer(createClient());
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <div className="flex justify-center"><LogoMark size={56} /></div>
      <p className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-brand-700">Community</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{c.name}</h1>
      {c.description && <p className="mt-2 text-ink-soft">{c.description}</p>}
      <p className="mt-3 text-[14px] text-ink-faint">{c.members} member{c.members === 1 ? "" : "s"}{c.owner_name ? ` · Ambassador: ${c.owner_name}` : ""}</p>
      <p className="mx-auto mt-4 max-w-sm text-[14px] text-ink-soft">Join to see the cleaners, tutors, stylists and more that this community recommends — and filter any search by its ratings.</p>
      {c.is_member ? (
        <><p className="mt-8 font-semibold">You're in 🎉</p><Link href={`/search?service=all&circle=${c.slug}`} className="btn-primary mt-4 w-full">See this community's picks</Link></>
      ) : user ? (
        <JoinCommunity code={params.code} />
      ) : (
        <>
          <Link href={`/signup?community=${params.code}`} className="btn-primary mt-8 w-full">Sign up & join</Link>
          <p className="mt-4 text-[14px] text-ink-soft">Already a member? <Link className="font-semibold text-brand-700" href={`/login?next=/c/${params.code}`}>Sign in</Link></p>
        </>
      )}
    </div>
  );
}
