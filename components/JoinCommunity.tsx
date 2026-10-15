"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function JoinCommunity({ code }: { code: string }) {
  const router = useRouter();
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <div>
      <button className="btn-primary mt-8 w-full" disabled={busy} onClick={async () => {
        setBusy(true); setErr("");
        const { data, error } = await createClient().rpc("join_community", { code });
        setBusy(false);
        if (error || data !== "ok") return setErr(error?.message || data);
        router.push("/network#communities"); router.refresh();
      }}>{busy ? "Joining…" : "Join community"}</button>
      {err && <p className="mt-3 text-[14px] text-red-600">{err}</p>}
    </div>
  );
}
