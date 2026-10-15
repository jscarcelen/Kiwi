import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminConsole from "@/components/admin/AdminConsole";

export const metadata: Metadata = { title: "WOM admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const ok = auth.user ? (await supabase.rpc("is_admin")).data === true : false;
  if (!ok) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold">Admins only</h1>
        <p className="mt-2 text-ink-soft">{auth.user ? "This account isn't an admin. Ask an existing admin to add you." : "Sign in with an admin account to continue."}</p>
        {!auth.user && <Link href="/login?next=/admin" className="btn-primary mt-6 inline-block">Sign in</Link>}
      </div>
    );
  }
  return <AdminConsole me={auth.user!.id} />;
}
