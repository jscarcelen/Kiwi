"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUSES: [string, string, string][] = [
  ["new", "To do", "bg-amber-100 text-amber-800"],
  ["prompted", "Prompted", "bg-sky-100 text-sky-800"],
  ["implemented", "Implemented", "bg-kiwi-100 text-kiwi-700"],
  ["dismissed", "Dismissed", "bg-black/10 text-ink-soft"],
];
const CAT: Record<string, string> = { idea: "💡", bug: "🐞", design: "🎨", copy: "✏️" };
const COLS = "id,created_at,reporter,category,comment,path,url,target,selected_text,has_screenshot,viewport,status,note,implemented_at";

export default function FeedbackBoard() {
  const s = useMemo(() => createClient(), []);
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState("new");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<any | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [extra, setExtra] = useState("");
  const [refine, setRefine] = useState(true);
  const [out, setOut] = useState<{ prompt: string; refined: boolean; warnings: string[]; note?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await s.from("feedback").select(COLS).order("created_at", { ascending: false });
    if (error) setError(error.message); else setItems(data ?? []);
  }, [s]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setShot(null);
    if (focus?.has_screenshot) s.from("feedback").select("screenshot").eq("id", focus.id).maybeSingle().then(({ data }) => setShot(data?.screenshot ?? null));
  }, [focus?.id, focus?.has_screenshot, s]);

  const counts = (k: string) => items.filter((i) => i.status === k).length;
  const shown = items.filter((i) => i.status === tab && (!q || `${i.comment} ${i.path} ${i.reporter}`.toLowerCase().includes(q.toLowerCase())));
  const toggle = (id: string) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const setStatus = async (ids: string[], status: string, note?: string) => {
    const patch: any = { status, implemented_at: status === "implemented" ? new Date().toISOString() : null };
    if (note !== undefined) patch.note = note;
    await s.from("feedback").update(patch).in("id", ids);
    setItems((p) => p.map((i) => (ids.includes(i.id) ? { ...i, ...patch } : i)));
    setFocus((f: any) => (f && ids.includes(f.id) ? { ...f, ...patch } : f));
  };

  const generate = async () => {
    setBusy(true); setOut(null); setError("");
    const res = await fetch("/api/feedback/prompt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: [...sel], extra, refine }) });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setError(j.error || "Failed");
    setOut(j);
  };

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-5 py-8 lg:grid-cols-[420px_1fr]">
      {/* LIST */}
      <section className="card flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden">
        <div className="border-b border-black/5 p-4">
          <div className="flex items-center justify-between"><h1 className="text-xl font-semibold tracking-tight">Feedback</h1><button className="text-[13px] text-ink-soft hover:underline" onClick={load}>Refresh</button></div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STATUSES.map(([k, l]) => <button key={k} onClick={() => { setTab(k); setSel(new Set()); }} className={`rounded-full px-3 py-1 text-[13px] ${tab === k ? "bg-ink text-white" : "bg-black/5"}`}>{l} · {counts(k)}</button>)}
          </div>
          <input className="input mt-3 !py-2" placeholder="Search comments, pages, people…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <ul className="flex-1 divide-y divide-black/5 overflow-y-auto">
          {shown.length === 0 && <li className="p-8 text-center text-ink-soft">Nothing here.</li>}
          {shown.map((i) => (
            <li key={i.id} onClick={() => { setFocus(i); setOut(null); }} className={`flex cursor-pointer gap-3 p-4 hover:bg-black/[0.03] ${focus?.id === i.id ? "bg-kiwi-50" : ""}`}>
              <input type="checkbox" className="mt-1 h-4 w-4 accent-kiwi-600" checked={sel.has(i.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggle(i.id)} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[14px]">{CAT[i.category]} {i.comment}</p>
                <p className="mt-1 truncate text-[12px] text-ink-faint">{i.path} · {i.reporter?.split("<")[0]} · {new Date(i.created_at).toLocaleDateString()} {i.has_screenshot && "· 📸"}{i.target && " · 👆"}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-black/5 p-3">
          <button className="btn-primary w-full" disabled={sel.size === 0 || busy} onClick={generate}>{busy ? "Generating…" : `Generate Claude Code prompt${sel.size ? ` (${sel.size})` : ""}`}</button>
        </div>
      </section>

      {/* RIGHT */}
      <section className="space-y-5">
        {error && <div className="rounded-2xl bg-red-50 p-4 text-[14px] text-red-700">{error}</div>}
        {(sel.size > 0 || out) && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Prompt builder</h2>
            <p className="text-[13px] text-ink-soft">{sel.size} item{sel.size === 1 ? "" : "s"} selected. Combines comment, page, element, files to touch, and acceptance criteria.</p>
            <textarea className="input mt-3 min-h-[60px]" placeholder="Optional extra instructions for Claude Code (e.g. 'keep the change behind a feature flag')" value={extra} onChange={(e) => setExtra(e.target.value)} />
            <label className="mt-2 flex items-center gap-2 text-[13px]"><input type="checkbox" className="accent-kiwi-600" checked={refine} onChange={(e) => setRefine(e.target.checked)} /> Refine with AI (needs OPENAI_API_KEY on Vercel)</label>
            {out && (
              <div className="mt-4">
                {out.note && <p className="mb-2 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900">{out.note}</p>}
                {out.warnings.map((w, k) => <p key={k} className="mb-2 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900">⚠ {w}</p>)}
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">{out.refined ? "Refined by AI" : "Structured prompt"}</div>
                <textarea readOnly className="input min-h-[360px] font-mono text-[12.5px]" value={out.prompt} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-dark" onClick={async () => { await navigator.clipboard.writeText(out.prompt); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>{copied ? "Copied ✓" : "Copy prompt"}</button>
                  <button className="btn-ghost" onClick={() => setStatus([...sel], "prompted")}>Mark as prompted</button>
                  <button className="btn-ghost" onClick={() => { setStatus([...sel], "implemented"); setSel(new Set()); setOut(null); }}>Mark implemented</button>
                </div>
              </div>
            )}
            {!out && <button className="btn-primary mt-3" disabled={busy} onClick={generate}>{busy ? "Generating…" : "Generate prompt"}</button>}
          </div>
        )}

        {focus ? (
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><span className="text-2xl">{CAT[focus.category]}</span><span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUSES.find((x) => x[0] === focus.status)![2]}`}>{STATUSES.find((x) => x[0] === focus.status)![1]}</span></div>
              <div className="flex gap-2">
                <select className="input !w-auto !py-1.5 !text-[13px]" value={focus.status} onChange={(e) => setStatus([focus.id], e.target.value)}>{STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <button className="btn-ghost !py-1.5 !text-[13px]" onClick={async () => { if (!confirm("Delete this feedback?")) return; await s.from("feedback").delete().eq("id", focus.id); setItems((p) => p.filter((i) => i.id !== focus.id)); setFocus(null); }}>Delete</button>
              </div>
            </div>
            <p className="mt-4 text-[18px] leading-relaxed">{focus.comment}</p>
            <dl className="mt-5 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-[120px_1fr]">
              <dt className="text-ink-faint">Page</dt><dd><a className="text-kiwi-700 underline" target="_blank" href={focus.url || focus.path}>{focus.path}</a></dd>
              <dt className="text-ink-faint">From</dt><dd>{focus.reporter} · {new Date(focus.created_at).toLocaleString()}</dd>
              {focus.viewport && <><dt className="text-ink-faint">Viewport</dt><dd>{focus.viewport.w}×{focus.viewport.h}</dd></>}
              {focus.target && <><dt className="text-ink-faint">Element</dt><dd><code className="break-all text-[12px]">{focus.target.selector}</code>{focus.target.text && <div className="mt-1 text-ink-soft">“{focus.target.text.slice(0, 160)}”</div>}</dd></>}
              {focus.selected_text && <><dt className="text-ink-faint">Highlighted</dt><dd>“{focus.selected_text}”</dd></>}
              {focus.implemented_at && <><dt className="text-ink-faint">Implemented</dt><dd>{new Date(focus.implemented_at).toLocaleString()}</dd></>}
            </dl>
            {focus.has_screenshot && (shot ? <div className="mt-5"><img src={shot} alt="Screenshot" className="max-w-full rounded-2xl ring-1 ring-black/10" /><a className="mt-2 inline-block text-[13px] text-kiwi-700 underline" href={shot} download={`kiwi-feedback-${focus.id.slice(0, 8)}.jpg`}>Download screenshot (to attach in Claude Code)</a></div> : <p className="mt-5 text-[13px] text-ink-faint">Loading screenshot…</p>)}
            <label className="label mt-5">Notes (e.g. commit / what was done)</label>
            <textarea key={focus.id} className="input min-h-[70px]" defaultValue={focus.note ?? ""} onBlur={(e) => e.target.value !== (focus.note ?? "") && setStatus([focus.id], focus.status, e.target.value)} />
          </div>
        ) : !out && sel.size === 0 && <div className="card p-12 text-center text-ink-soft">Select an item to see details, or tick several and generate a prompt.</div>}
      </section>
    </div>
  );
}
