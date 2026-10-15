"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PAGE = 25;
export default function UsersTab({ me }: { me: string }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<any>(null);
  const load = useCallback(async () => {
    setBusy(true);
    const { data, error } = await createClient().rpc("admin_users", { q, lim_n: PAGE, off_n: page * PAGE });
    setBusy(false);
    if (error) setMsg(error.message); else setRows(data ?? []);
  }, [q, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  const total = rows[0]?.total ?? 0;
  const s = createClient();

  async function block(u: any) {
    const reason = u.blocked ? null : prompt(`Block ${u.full_name || "this user"}? Reason (optional):`, "");
    if (!u.blocked && reason === null) return;
    const { error } = await s.rpc("admin_set_blocked", { uid: u.id, flag: !u.blocked, reason });
    setMsg(error ? error.message : u.blocked ? "Unblocked." : "Blocked. Their reviews are hidden and they can't post."); load();
  }
  async function del(u: any) {
    if (!confirm(`Permanently delete ${u.full_name || u.email}? This removes their account, reviews, listings and communities.`)) return;
    const { error } = await s.rpc("admin_delete_user", { uid: u.id });
    setMsg(error ? error.message : "Account deleted."); load();
  }
  async function saveEdit() {
    const { error } = await s.rpc("admin_update_profile", { uid: edit.id, new_name: edit.full_name, new_instagram: edit.instagram ?? "", new_city: edit.city ?? "Chicago" });
    setMsg(error ? error.message : "Saved."); if (!error) { setEdit(null); load(); }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-sm flex-1 rounded-full border border-black/10 px-4 py-2.5 text-[15px] outline-none" placeholder="Search name, email or phone" value={q} onChange={(e) => { setPage(0); setQ(e.target.value); }} />
        <span className="text-[13px] text-ink-soft">{busy ? "Loading…" : `${total} users`}</span>
      </div>
      {msg && <p className="mt-3 rounded-xl bg-brand-50 p-3 text-[13px] text-brand-700">{msg}{msg.includes("function") && " — run supabase/admin.sql first."}</p>}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-[13px]">
          <thead className="bg-black/[0.03] text-left text-ink-soft"><tr><th className="p-3">User</th><th>Type</th><th>Joined</th><th>Last seen</th><th title="friends / reviews / communities owned">F / R / C</th><th>Credits</th><th className="pr-3 text-right">Actions</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className={`border-t border-black/5 ${u.blocked ? "bg-red-50/60" : ""}`}>
                <td className="p-3"><div className="font-medium">{u.full_name || "—"} {u.is_admin && <span className="ml-1 rounded bg-navy px-1.5 py-0.5 text-[10px] text-white">ADMIN</span>} {u.blocked && <span className="ml-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white">BLOCKED</span>}</div><div className="text-ink-faint">{u.email || u.phone || ""}</div></td>
                <td>{u.archetype}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>{u.last_seen ? new Date(u.last_seen).toLocaleDateString() : "—"}</td>
                <td>{u.friends} / {u.reviews} / {u.owned}</td>
                <td>{u.credits}</td>
                <td className="whitespace-nowrap pr-3 text-right">
                  <button className="mr-2 text-brand-700 hover:underline" onClick={() => setEdit({ ...u })}>Edit</button>
                  {u.id !== me && <><button className="mr-2 hover:underline" onClick={() => block(u)}>{u.blocked ? "Unblock" : "Block"}</button><button className="text-red-600 hover:underline" onClick={() => del(u)}>Delete</button></>}
                </td>
              </tr>
            ))}
            {!rows.length && !busy && <tr><td colSpan={7} className="p-6 text-center text-ink-faint">No users found</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-[13px]">
        <button className="btn-ghost !py-2" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
        <span className="text-ink-soft">Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE))}</span>
        <button className="btn-ghost !py-2" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(page + 1)}>Next →</button>
      </div>
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEdit(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-ink" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Edit profile</h3>
            {(["full_name", "instagram", "city"] as const).map((k) => <label key={k} className="mt-3 block text-[13px] capitalize text-ink-soft">{k.replace("_", " ")}<input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink outline-none" value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></label>)}
            <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost !py-2" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary !py-2" onClick={saveEdit}>Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
