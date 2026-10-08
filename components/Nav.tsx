import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import SignOutButton from "./SignOutButton";

export default async function Nav() {
  const supabase = createClient();
  const { user, profile } = await getViewer(supabase);
  const isAdmin = user ? (await supabase.rpc("is_admin")).data === true : false;
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 text-[20px] font-semibold tracking-tight">
          <span className="text-2xl">🥝</span> kiwi
        </Link>
        <nav className="flex items-center gap-1 text-[14px]">
          <Link href="/search" className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-black/5">Browse</Link>
          {user ? (
            <>
              <Link href="/network" className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-black/5">My network</Link>
              {isAdmin && <Link href="/admin/feedback" className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-black/5">Feedback</Link>}
              {profile?.is_provider && <Link href="/provider/dashboard" className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-black/5">Dashboard</Link>}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/provider/signup" className="hidden rounded-full px-3 py-1.5 text-ink-soft hover:bg-black/5 sm:block">For providers</Link>
              <Link href="/login" className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-black/5">Sign in</Link>
              <Link href="/signup" className="btn-dark !py-1.5 !text-[14px]">Join</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
