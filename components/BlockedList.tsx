"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BlockedList() {
  const [rows, setRows] = useState<{ id: string; full_name: string }[] | null>(null);
  const load = async () => { const { data } = await createClient().rpc("my_blocked"); setRows(data ?? []); };
  useEffect(() => { load(); }, []);
  if (!rows) return null;
  if (!rows.length) return <p className="text-[14px] text-ink-soft">You haven't blocked anyone.</p>;
  return <ul className="divide-y divide-black/5">{rows.map((r) => <li key={r.id} className="flex items-center justify-between py-2 text-[14px]"><span>{r.full_name || "Member"}</span><button className="text-brand-700 hover:underline" onClick={async () => { await createClient().rpc("unblock_user", { target: r.id }); load(); }}>Unblock</button></li>)}</ul>;
}
