"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./ui";

export default function SendProject({ top, category, summary, answers, city, when }: { top: { id: string; company: string }[]; category: string; summary: string; answers: Record<string, string[]>; city: string; when?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  const send = async () => {
    setState("sending"); setErr("");
    const s = createClient();
    const { data } = await s.auth.getUser();
    if (!data.user) return router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    const { data: p } = await s.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
    const contact = `${p?.full_name ?? ""} · ${data.user.email ?? ""}${data.user.phone ? " · +" + data.user.phone : ""}`.trim();
    const { error } = await s.from("project_requests").insert({ user_id: data.user.id, category, summary, answers, city, timeline: when ?? null, contact, provider_ids: top.map((t) => t.id) });
    if (error) { setErr(error.message); setState("idle"); return; }
    setState("sent");
  };
  if (!top.length) return null;
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-kiwi-50 p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <div className="flex -space-x-2">{top.map((t) => <Avatar key={t.id} id={t.id} name={t.company} size={40} />)}</div>
        <div>
          <p className="font-semibold">{state === "sent" ? "Sent! They'll reach out soon." : `Send your project to your top ${top.length} matches`}</p>
          <p className="text-[14px] text-ink-soft">{state === "sent" ? top.map((t) => t.company).join(", ") : "These pros fit your project and are best rated by your network. We share your name and contact only with them."}</p>
          {err && <p className="text-[13px] text-red-600">{err}</p>}
        </div>
      </div>
      {state !== "sent" && <button className="btn-primary shrink-0" disabled={state === "sending"} onClick={send}>{state === "sending" ? "Sending…" : `Message top ${top.length}`}</button>}
    </div>
  );
}
