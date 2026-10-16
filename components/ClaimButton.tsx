"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClaimButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const claim = async () => {
    setBusy(true); setErr("");
    const { data, error } = await createClient().rpc("claim_pro", { tok: token });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data?.error) return setErr(data.error);
    router.push("/provider/dashboard");
  };
  return <><button className="btn-primary w-full" onClick={claim} disabled={busy}>{busy ? "Claiming…" : "Claim this profile"}</button>{err && <p className="mt-2 text-[14px] text-red-600">{err}</p>}</>;
}
