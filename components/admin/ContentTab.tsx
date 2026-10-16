"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";

const SUB = ["Reports", "Reviews", "Profiles", "Communities"] as const;
export default function ContentTab() {
  const [sub, setSub] = useState<(typeof SUB)[number]>("Reports");
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<any>(null);
  const s = createClient();
  const load = useCallback(async () => {
    setMsg("");
    const fn = sub === "Reports" ? "admin_reports" : sub === "Reviews" ? "admin_reviews" : sub === "Profiles" ? "admin_providers" : "admin_communities";
    const { data, error } = await s.rpc(fn, sub === "Reviews" ? { lim_n: 200 } : sub === "Reports" ? { only_open: true } : {});
    if (error) setMsg(error.message); else setRows(data ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub]);
  useEffect(() => { load(); }, [load]);

  async function remove(fn: string, arg: Record<string, string>, what: string) {
    if (!confirm(`Delete this ${what}? This can't be undone.`)) return;
    const { error } = await s.rpc(fn, arg); setMsg(error ? error.message : "Deleted."); load();
  }
  async function save() {
    const { error } = await s.rpc("admin_update_provider", { pid: edit.id, new_company: edit.company, new_category: edit.category, new_city: edit.city, new_description: edit.description ?? "" });
    setMsg(error ? error.message : "Saved."); if (!error) { setEdit(null); load(); }
  }
  return (
    <div>
      <div className="flex gap-2 text-[14px]">{SUB.map((t) => <button key={t} onClick={() => setSub(t)} className={`rounded-full px-4 py-1.5 ${sub === t ? "bg-navy text-white" : "bg-black/5"}`}>{t}</button>)}</div>
      {msg && <p className="mt-3 rounded-xl bg-brand-50 p-3 text-[13px] text-brand-700">{msg}</p>}
      <div className="mt-4 space-y-2">
        {sub === "Reports" && rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-black/5 bg-white p-4 text-[14px]">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-red-700">{r.target_type}</span><b>{r.reason}</b><span className="text-[12px] text-ink-faint">by {r.reporter || "?"} · {new Date(r.created_at).toLocaleString()}</span></div>
            <p className="mt-1 text-ink-soft">{r.summary || "(content already removed)"}</p>
            {r.details && <p className="mt-1 text-[13px] italic text-ink-faint">"{r.details}"</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
              {r.target_type === "review" && r.summary && <button className="text-red-600 hover:underline" onClick={async () => { if (!confirm("Delete this review?")) return; const { error } = await s.rpc("admin_delete_review", { rid: r.target_id }); if (!error) await s.rpc("admin_resolve_report", { rid: r.id, new_status: "resolved" }); setMsg(error ? error.message : "Review deleted."); load(); }}>Delete review</button>}
              {r.target_type === "provider" && r.summary && <button className="text-red-600 hover:underline" onClick={async () => { if (!confirm("Delete this profile?")) return; const { error } = await s.rpc("admin_delete_provider", { pid: r.target_id }); if (!error) await s.rpc("admin_resolve_report", { rid: r.id, new_status: "resolved" }); setMsg(error ? error.message : "Profile deleted."); load(); }}>Delete profile</button>}
              {r.author_id && <button className="hover:underline" onClick={async () => { const { error } = await s.rpc("admin_set_blocked", { uid: r.author_id, flag: true, reason: `Report: ${r.reason}` }); setMsg(error ? error.message : "Author blocked."); }}>Block author</button>}
              <button className="text-brand-700 hover:underline" onClick={async () => { await s.rpc("admin_resolve_report", { rid: r.id, new_status: "resolved" }); load(); }}>Mark resolved</button>
              <button className="text-ink-faint hover:underline" onClick={async () => { await s.rpc("admin_resolve_report", { rid: r.id, new_status: "dismissed" }); load(); }}>Dismiss</button>
            </div>
          </div>
        ))}
        {sub === "Reviews" && rows.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 text-[14px]">
            <div><div><span className="font-semibold">{r.reviewer || "?"}</span> → <span className="font-semibold">{r.provider || "?"}</span> · {"★".repeat(r.rating)}<span className="text-ink-faint"> · {new Date(r.created_at).toLocaleDateString()} {r.shared ? "" : "· private"}</span></div>{r.comment && <p className="mt-1 text-ink-soft">{r.comment}</p>}</div>
            <button className="shrink-0 text-red-600 hover:underline" onClick={() => remove("admin_delete_review", { rid: r.id }, "review")}>Delete</button>
          </div>
        ))}
        {sub === "Profiles" && rows.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 text-[14px]">
            <div><div className="font-semibold">{p.company} <span className="font-normal text-ink-faint">· {CATEGORIES.find((c) => c.slug === p.category)?.label ?? p.category} · {p.city}</span></div><div className="text-[13px] text-ink-soft">★{p.avg_rating ?? "–"} ({p.n ?? 0}) · {p.views} views · {p.contacts} contacts · owner: {p.owner || "none (seed)"}</div></div>
            <div className="shrink-0"><button className="mr-3 text-brand-700 hover:underline" onClick={() => setEdit({ ...p })}>Edit</button><button className="text-red-600 hover:underline" onClick={() => remove("admin_delete_provider", { pid: p.id }, "supplier profile")}>Delete</button></div>
          </div>
        ))}
        {sub === "Communities" && rows.map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 text-[14px]">
            <div><div className="font-semibold">{c.name} {c.official && <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] text-brand-700">OFFICIAL</span>}</div><div className="text-[13px] text-ink-soft">{c.members} members · {c.owner ? `ambassador: ${c.owner}` : "no owner"}</div></div>
            <button className="shrink-0 text-red-600 hover:underline" onClick={() => remove("admin_delete_community", { gid: c.id }, "community")}>Delete</button>
          </div>
        ))}
        {!rows.length && <p className="py-8 text-center text-ink-faint">Nothing here.</p>}
      </div>
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEdit(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 text-ink" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Edit supplier profile</h3>
            <label className="mt-3 block text-[13px] text-ink-soft">Company<input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink outline-none" value={edit.company ?? ""} onChange={(e) => setEdit({ ...edit, company: e.target.value })} /></label>
            <label className="mt-3 block text-[13px] text-ink-soft">Category<select className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></label>
            <label className="mt-3 block text-[13px] text-ink-soft">City<input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink outline-none" value={edit.city ?? ""} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></label>
            <label className="mt-3 block text-[13px] text-ink-soft">Description<textarea rows={4} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink outline-none" value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></label>
            <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost !py-2" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary !py-2" onClick={save}>Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
