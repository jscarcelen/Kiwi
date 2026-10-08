"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function DeleteAccount() {
  const router = useRouter();
  return (
    <button className="text-[13px] text-ink-faint hover:text-red-600" onClick={async () => {
      if (!confirm("Permanently delete your account, reviews and connections? This can't be undone.")) return;
      const s = createClient();
      const { error } = await s.rpc("delete_my_account");
      if (error) return alert(error.message);
      await s.auth.signOut(); router.push("/"); router.refresh();
    }}>Delete my account</button>
  );
}
