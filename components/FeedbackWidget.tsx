"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Target = { selector: string; tag: string; text: string; html: string; rect: { x: number; y: number; w: number; h: number } };
const CATS: [string, string][] = [["idea", "💡 Idea"], ["bug", "🐞 Bug"], ["design", "🎨 Design"], ["copy", "✏️ Wording"]];

function selectorFor(el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== document.body && parts.length < 5) {
    let part = cur.tagName.toLowerCase();
    if (cur.id) { parts.unshift(`${part}#${cur.id}`); break; }
    const cls = [...cur.classList].filter((c) => !/[:\[\]\/]/.test(c)).slice(0, 2);
    if (cls.length) part += "." + cls.join(".");
    const parent: Element | null = cur.parentElement;
    if (parent) {
      const same = [...parent.children].filter((s) => s.tagName === cur!.tagName);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
    }
    parts.unshift(part);
    cur = parent;
  }
  return parts.join(" > ");
}
const ours = (el: Element | null) => !!el?.closest("[data-kiwi-feedback]");

async function shoot(r: { x: number; y: number; w: number; h: number }) {
  const html2canvas = (await import("html2canvas")).default;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const full = await html2canvas(document.documentElement, {
    scale, useCORS: true, logging: false, ignoreElements: (el) => el.hasAttribute("data-kiwi-feedback"),
    width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
    windowWidth: document.documentElement.scrollWidth, windowHeight: document.documentElement.scrollHeight,
  });
  const sx = (r.x + window.scrollX) * scale, sy = (r.y + window.scrollY) * scale;
  const sw = Math.min(r.w * scale, full.width - sx), sh = Math.min(r.h * scale, full.height - sy);
  const out = document.createElement("canvas");
  const k = Math.min(1, 1200 / sw);
  out.width = Math.max(1, Math.round(sw * k)); out.height = Math.max(1, Math.round(sh * k));
  out.getContext("2d")!.drawImage(full, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", 0.8);
}

export default function FeedbackWidget() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"idle" | "pick" | "area" | "shooting">("idle");
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("idea");
  const [target, setTarget] = useState<Target | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [hover, setHover] = useState<DOMRect | null>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const dragRef = useRef(drag);
  dragRef.current = drag;

  // element picker
  useEffect(() => {
    if (mode !== "pick") return;
    const move = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      setHover(el && !ours(el) ? el.getBoundingClientRect() : null);
    };
    const click = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || ours(el)) return;
      e.preventDefault(); e.stopPropagation();
      const b = el.getBoundingClientRect();
      setTarget({
        selector: selectorFor(el), tag: el.tagName.toLowerCase(),
        text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 200),
        html: el.outerHTML.replace(/\s+/g, " ").slice(0, 300),
        rect: { x: Math.round(b.x + window.scrollX), y: Math.round(b.y + window.scrollY), w: Math.round(b.width), h: Math.round(b.height) },
      });
      setHover(null); setMode("idle"); setOpen(true);
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setMode("idle"); setHover(null); setOpen(true); } };
    document.addEventListener("mousemove", move, true);
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key, true);
    return () => { document.removeEventListener("mousemove", move, true); document.removeEventListener("click", click, true); document.removeEventListener("keydown", key, true); };
  }, [mode]);

  useEffect(() => {
    if (mode !== "area") return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setMode("idle"); setDrag(null); setOpen(true); } };
    document.addEventListener("keydown", key, true);
    return () => document.removeEventListener("keydown", key, true);
  }, [mode]);

  const finishArea = async () => {
    const d = dragRef.current; setDrag(null);
    if (!d) return setMode("idle");
    const r = { x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1), w: Math.abs(d.x1 - d.x0), h: Math.abs(d.y1 - d.y0) };
    if (r.w < 12 || r.h < 12) { setMode("idle"); setOpen(true); return; }
    setMode("shooting");
    await new Promise((res) => setTimeout(res, 60));
    try { setShot(await shoot(r)); } catch (e: any) { setErr("Couldn't capture that area. You can still send your feedback."); }
    setMode("idle"); setOpen(true);
  };

  const send = async () => {
    if (!comment.trim()) return setErr("Tell us what you think first.");
    setState("sending"); setErr("");
    const s = createClient();
    const { data } = await s.auth.getUser();
    let reporter = "Anonymous";
    if (data.user) {
      const { data: p } = await s.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
      reporter = `${p?.full_name || "User"} <${data.user.email}>`;
    }
    const { error } = await s.from("feedback").insert({
      user_id: data.user?.id ?? null, reporter, category, comment: comment.trim(),
      path: window.location.pathname + window.location.search, url: window.location.href,
      target, selected_text: selected || null, screenshot: shot,
      viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio, scrollY: Math.round(window.scrollY) },
      user_agent: navigator.userAgent,
    });
    if (error) { setErr(error.message); setState("error"); return; }
    setState("sent");
    setTimeout(() => { setOpen(false); setState("idle"); setComment(""); setTarget(null); setShot(null); setSelected(""); }, 1800);
  };

  const hideUI = mode === "pick" || mode === "area" || mode === "shooting";
  if (path?.startsWith("/admin")) return null;
  return (
    <div data-kiwi-feedback>
      {!hideUI && (
        <button
          onMouseDown={() => setSelected(window.getSelection()?.toString().trim().slice(0, 300) || "")}
          onClick={() => setOpen((o) => !o)}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-[2147483000] flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[14px] font-medium text-white shadow-pop transition hover:bg-black active:scale-95"
        >
          💬 Feedback
        </button>
      )}
      {open && !hideUI && (
        <div className="fixed bottom-20 right-5 z-[2147483000] w-[min(360px,calc(100vw-2.5rem))] rounded-3xl bg-white p-5 shadow-pop ring-1 ring-black/5">
          {state === "sent" ? (
            <div className="py-8 text-center"><div className="text-4xl">🥝</div><p className="mt-2 font-semibold">Thanks — got it!</p></div>
          ) : (
            <>
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Send feedback</h3><button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink" aria-label="Close">✕</button></div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {CATS.map(([k, l]) => <button key={k} onClick={() => setCategory(k)} className={`rounded-full px-3 py-1 text-[13px] ${category === k ? "bg-kiwi-600 text-white" : "bg-black/5"}`}>{l}</button>)}
              </div>
              <textarea className="input mt-3 min-h-[96px]" placeholder="What's on your mind? Be as specific as you like." value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="mt-3 flex gap-2">
                <button className="btn-ghost flex-1 !px-3 !py-2 !text-[13px]" onClick={() => { setOpen(false); setMode("pick"); }}>👆 Point at something</button>
                <button className="btn-ghost flex-1 !px-3 !py-2 !text-[13px]" onClick={() => { setOpen(false); setMode("area"); }}>📸 Capture area</button>
              </div>
              {(target || shot || selected) && (
                <div className="mt-3 space-y-2 text-[12px]">
                  {target && <div className="flex items-start justify-between gap-2 rounded-xl bg-kiwi-50 p-2.5"><span><b>Pointing at</b> &lt;{target.tag}&gt; {target.text && `“${target.text.slice(0, 50)}${target.text.length > 50 ? "…" : ""}”`}</span><button onClick={() => setTarget(null)}>✕</button></div>}
                  {selected && <div className="flex items-start justify-between gap-2 rounded-xl bg-kiwi-50 p-2.5"><span><b>Highlighted text</b> “{selected.slice(0, 60)}”</span><button onClick={() => setSelected("")}>✕</button></div>}
                  {shot && <div className="relative"><img src={shot} alt="Screenshot" className="max-h-32 w-full rounded-xl object-cover ring-1 ring-black/10" /><button className="absolute right-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5" onClick={() => setShot(null)}>✕</button></div>}
                </div>
              )}
              {err && <p className="mt-2 text-[13px] text-red-600">{err}</p>}
              <button className="btn-primary mt-3 w-full" disabled={state === "sending"} onClick={send}>{state === "sending" ? "Sending…" : "Send feedback"}</button>
            </>
          )}
        </div>
      )}

      {mode === "pick" && (
        <>
          <div className="pointer-events-none fixed inset-x-0 top-4 z-[2147483001] flex justify-center"><div className="rounded-full bg-ink px-4 py-2 text-[13px] text-white shadow-pop">Click the thing you want to talk about · Esc to cancel</div></div>
          {hover && <div className="pointer-events-none fixed z-[2147483001] rounded-md border-2 border-kiwi-500 bg-kiwi-500/15" style={{ left: hover.left, top: hover.top, width: hover.width, height: hover.height }} />}
          <style>{`body{cursor:crosshair !important} body *{cursor:crosshair !important}`}</style>
        </>
      )}
      {mode === "area" && (
        <div
          className="fixed inset-0 z-[2147483001] cursor-crosshair touch-none bg-black/20 select-none"
          onPointerDown={(e) => setDrag({ x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY })}
          onPointerMove={(e) => drag && setDrag({ ...drag, x1: e.clientX, y1: e.clientY })}
          onPointerUp={finishArea}
        >
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center"><div className="rounded-full bg-ink px-4 py-2 text-[13px] text-white shadow-pop">Drag to select an area · Esc to cancel</div></div>
          {drag && <div className="absolute border-2 border-kiwi-500 bg-kiwi-500/10" style={{ left: Math.min(drag.x0, drag.x1), top: Math.min(drag.y0, drag.y1), width: Math.abs(drag.x1 - drag.x0), height: Math.abs(drag.y1 - drag.y0) }} />}
        </div>
      )}
    </div>
  );
}
