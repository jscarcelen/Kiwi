"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type C = { id: string; name: string; email_domain: string };
// Offers communities the user's confirmed email domain qualifies for (e.g. @uchicago.edu → UChicago).
export default function VerifiedPrompt() {
  const router = useRouter();
  const [rows, setRows] = useState<C[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => { createClient().rpc("my_domain_communities").then(({ data }) => setRows((data as C[]) ?? [])); }, []);
  if (!rows.length) return msg ? <p className="mb-4 rounded-2xl bg-green-50 p-4 text-[14px] text-green-800">{msg}</p> : null;
  const join = async (c: C) => {
    const { data } = await createClient().rpc("join_verified_community", { gid: c.id });
    if (data === "ok") { setMsg(`You joined ${c.name} ✓`); setRows(rows.filter((r) => r.id !== c.id)); router.refresh(); } else setMsg(String(data));
  };
  return (
    <div className="mb-4 space-y-2">
      {rows.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-50 p-4">
          <p className="text-[14px] text-brand-700"><b>Your @{c.email_domain} email is verified.</b> Join {c.name} to see ratings from your whole campus.</p>
          <button className="btn-primary !py-2" onClick={() => join(c)}>Join {c.name}</button>
        </div>))}
    </div>
  );
}
