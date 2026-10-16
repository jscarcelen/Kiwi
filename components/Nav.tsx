import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import ExploreMenu from "./ExploreMenu";
import Logo from "./Logo";
import ConnectButton from "./ConnectButton";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import { CREDITS_PER_MONTH } from "@/lib/referrals";

export default async function Nav() {
  const supabase = createClient();
  const { user, profile } = await getViewer(supabase);
  const isAdmin = user ? (await supabase.rpc("is_admin")).data === true : false;
  const credits = user ? ((await supabase.from("referrals").select("credits")).data ?? []).reduce((a: number, r: any) => a + (r.credits ?? 0), 0) : 0;
  const link = "whitespace-nowrap rounded-full px-3 py-1.5 text-ink-soft hover:bg-black/5";
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-5">
        <Link href="/" className="flex shrink-0 items-center" aria-label="WOM home"><Logo height={30} /></Link>
        <nav className="flex min-w-0 items-center gap-0.5 text-[14px] sm:gap-1">
          <div className="hidden md:block"><ExploreMenu /></div>
          {user ? (
            <>
              <div className="hidden md:block"><ConnectButton me={user.id} /></div>
              <Link href="/network" className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-navy px-4 py-2 font-semibold text-white hover:bg-navy-700 md:flex">👥 My network</Link>
              {profile?.is_provider ? <Link href="/provider/dashboard" className={`${link} hidden lg:block`}>Dashboard</Link> : null}
              <NotificationBell />
              <Link href="/network" title="Credits earned toward Premium" className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-brand-700 hover:bg-brand-100">🎁 {credits}<span className="hidden lg:inline"> credits</span></Link>
              <UserMenu credits={credits} perMonth={CREDITS_PER_MONTH} name={profile?.full_name || user.email || "Account"} avatarUrl={profile?.avatar_url} isProvider={!!profile?.is_provider} isAdmin={isAdmin} />
            </>
          ) : (
            <>
              <Link href="/login" className="whitespace-nowrap rounded-full px-3 py-1.5 font-semibold text-ink hover:bg-black/5">Log in</Link>
              <Link href="/signup" className="whitespace-nowrap rounded-full bg-navy px-4 py-2 font-semibold text-white hover:bg-navy-700">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
