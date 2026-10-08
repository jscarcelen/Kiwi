"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function SignOutButton() {
  const router = useRouter();
  return (
    <button className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-black/5" onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }}>
      Sign out
    </button>
  );
}
