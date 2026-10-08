import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import FeedbackBoard from "@/components/FeedbackBoard";

export const dynamic = "force-dynamic";

export default async function FeedbackAdmin() {
  const supabase = createClient();
  const { user } = await getViewer(supabase);
  if (!user) redirect("/login?next=/admin/feedback");
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin)
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <div className="card p-8">
          <h1 className="text-2xl font-semibold">Admins only</h1>
          <p className="mt-2 text-ink-soft">Run <code>supabase/feedback.sql</code> in the Supabase SQL editor, or make this account an admin:</p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-black/5 p-4 text-[13px]">{`insert into public.admins (user_id)\nselect id from auth.users where email = '${user.email}'\non conflict do nothing;`}</pre>
        </div>
      </div>
    );
  return <FeedbackBoard />;
}
