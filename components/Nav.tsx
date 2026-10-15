import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import ExploreMenu from "./ExploreMenu";
import Logo from "./Logo";
import UserMenu from "./UserMenu";

export default async function Nav() {
  const supabase = createClient();
  const { user, profile } = await getViewer(supabase);
  const isAdmin = user ? (await supabase.rpc("is_admin")).data === true : false;
  const link = "rounded-full px-3 py-1.5 text-ink-soft hover:bg-black/5";
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center" aria-label="WOM home"><Logo height={32} /></Link>
        <nav className="flex items-center gap-0.5 text-[14px] sm:gap-1">
          <ExploreMenu />
          {user ? (
            <>
              <Link href="/network" className={link}>My network</Link>
              {profile?.is_provider ? <Link href="/provider/dashboard" className={`${link} hidden sm:block`}>Dashboard</Link> : <Link href="/provider/signup" className={`${link} hidden sm:block`}>Join as a pro</Link>}
              <UserMenu name={profile?.full_name || user.email || "Account"} avatarUrl={profile?.avatar_url} isProvider={!!profile?.is_provider} isAdmin={isAdmin} />
            </>
          ) : (
            <>
              <Link href="/provider/signup" className={`${link} hidden sm:block`}>Join as a pro</Link>
              <Link href="/login" className="rounded-full px-3 py-1.5 font-semibold text-ink hover:bg-black/5">Log in</Link>
              <Link href="/signup" className="rounded-full bg-navy-100 px-4 py-2 font-semibold text-navy hover:bg-navy/20">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
