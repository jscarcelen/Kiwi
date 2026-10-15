"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CATEGORIES, catEmoji, catLabel } from "@/lib/categories";
import { LogoMark } from "./Logo";
import SuggestionList from "./SuggestionList";
import { suggest, type Sug } from "@/lib/suggestions";
import { QUESTIONS, WHEN, answersToParams, type Answers, type Q } from "@/lib/intake";

const EXAMPLES = ["Deep clean my 1-bedroom before I move out", "Walk my two dogs every weekday", "Case interview coach for MBB recruiting", "Balayage and a haircut this weekend"];

export default function IntakeModal({ open, onClose, initialText = "", initialCategory = null, initialSuggestion = null, city = "Chicago" }: { open: boolean; onClose: () => void; initialText?: string; initialCategory?: string | null; initialSuggestion?: Sug | null; city?: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<"describe" | "thinking" | "pick" | "ask">("describe");
  const [text, setText] = useState(initialText);
  const [category, setCategory] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [reply, setReply] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [picked, setPicked] = useState<Answers>({});
  const [queue, setQueue] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);

  const begin = (cat: string, prefilled: Answers, sum: string, msg: string) => {
    const qs = [...(QUESTIONS[cat] ?? []), WHEN].filter((q) => !prefilled[q.id]?.length);
    setCategory(cat); setSummary(sum); setReply(msg); setAnswers(prefilled); setPicked(prefilled); setQueue(qs); setIdx(0); setStage("ask");
  };

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    if (initialSuggestion) pickSug(initialSuggestion);
    else if (initialCategory) begin(initialCategory, {}, catLabel(initialCategory), `Great — let's find the right ${catLabel(initialCategory).toLowerCase()} pro.`);
    else if (initialText.trim()) { setText(initialText); analyze(initialText); }
    else setStage("describe");
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [open]); // eslint-disable-line

  const pickSug = (g: Sug) => begin(g.category, g.answers ?? {}, g.label, `Great — ${g.label.toLowerCase()}. Let me ask a few quick questions.`);

  const analyze = async (t = text) => {
    if (!t.trim()) return;
    setStage("thinking");
    try {
      const r = await fetch("/api/intake", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t }) });
      const j = await r.json();
      if (j.category) begin(j.category, j.answers ?? {}, j.summary || t, j.reply || "");
      else { setSummary(t); setReply(j.reply); setStage("pick"); }
    } catch { setReply("Which of these fits best?"); setStage("pick"); }
  };

  const finish = (final: Answers) => {
    if (!category) return;
    const { when, ...rest } = final;
    const p = new URLSearchParams({ service: category, city, ...answersToParams(rest) });
    if (summary && summary !== catLabel(category)) p.set("q", summary);
    if (when?.[0]) p.set("when", when[0]);
    onClose(); router.push(`/search?${p}`);
  };
  const next = () => (idx + 1 < queue.length ? setIdx(idx + 1) : finish(answers));
  const q = queue[idx];
  const toggle = (v: string) => {
    if (!q) return;
    const cur = answers[q.id] ?? [];
    setAnswers({ ...answers, [q.id]: q.type === "single" ? [v] : cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  const back = () => (stage === "ask" && idx > 0 ? setIdx(idx - 1) : setStage("describe"));
  if (!open) return null;
  const pct = stage === "ask" ? ((idx + 1) / queue.length) * 100 : stage === "describe" ? 8 : 20;
  const chips = category ? Object.entries(picked).flatMap(([k, v]) => v.map((x) => QUESTIONS[category]?.find((qq) => qq.id === k)?.options.find((o) => o.value === x)?.label ?? x)) : [];

  const ui = (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 text-ink sm:items-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop sm:max-w-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <button onClick={back} className={`rounded-full p-2 hover:bg-black/5 ${stage === "describe" ? "invisible" : ""}`} aria-label="Back">←</button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-[15px] font-semibold"><LogoMark size={18} /> WOM assistant</div>
            {category && <button className="text-[13px] text-brand-700" onClick={() => setStage("describe")}>{catLabel(category)} · change</button>}
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-black/5" aria-label="Close">✕</button>
        </div>
        <div className="h-1 bg-black/5"><div className="h-1 bg-navy transition-all" style={{ width: `${pct}%` }} /></div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {stage === "describe" && (
            <>
              <Bubble>Hi! 👋 What do you need help with? Describe it in your own words — I'll find the right pros and ask a few quick questions.</Bubble>
              <textarea autoFocus className="input mt-4 min-h-[110px]" placeholder="e.g. I need a deep clean for my 1-bedroom before moving out" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyze(); } }} />
              {text.trim() ? (
                <div className="mt-2"><SuggestionList items={suggest(text)} text={text} onPick={pickSug} onAsk={() => analyze()} /></div>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">{EXAMPLES.map((x) => <button key={x} onClick={() => setText(x)} className="rounded-full bg-black/5 px-3 py-1.5 text-[13px] hover:bg-black/10">{x}</button>)}</div>
                  <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Or pick a category</p>
                  <div className="grid grid-cols-2 gap-2">{CATEGORIES.map((c) => <button key={c.slug} onClick={() => begin(c.slug, {}, c.label, `Great — let's find the right ${c.label.toLowerCase()} pro.`)} className="rounded-xl border border-black/10 p-3 text-left text-[14px] hover:border-navy"><span className="mr-1">{c.emoji}</span>{c.label}</button>)}</div>
                </>
              )}
            </>
          )}
          {stage === "thinking" && <div className="py-16 text-center text-ink-soft"><div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-navy" />Understanding your request…</div>}
          {stage === "pick" && (
            <>
              <Bubble>{reply}</Bubble>
              <div className="mt-4 grid grid-cols-2 gap-2">{CATEGORIES.map((c) => <button key={c.slug} onClick={() => begin(c.slug, {}, summary, "")} className="rounded-xl border border-black/10 p-4 text-left hover:border-navy"><div className="text-2xl">{c.emoji}</div><div className="mt-1 font-medium">{c.label}</div></button>)}</div>
            </>
          )}
          {stage === "ask" && q && (
            <>
              {idx === 0 && reply && <Bubble>{reply}{chips.length > 0 && <span className="mt-2 flex flex-wrap gap-1.5">{chips.map((c) => <span key={c} className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[12px] text-brand-700">✓ {c}</span>)}</span>}</Bubble>}
              <h2 className="mt-5 text-center text-2xl font-semibold tracking-tight">{q.title}</h2>
              {q.type === "multi" && <p className="mt-1 text-center text-[13px] text-ink-faint">Select all that apply</p>}
              <div className="mt-5 space-y-2">
                {q.options.map((o) => {
                  const on = (answers[q.id] ?? []).includes(o.value);
                  return (
                    <button key={o.value} onClick={() => toggle(o.value)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${on ? "border-navy bg-brand-50" : "border-black/10 hover:border-black/30"}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center border text-[11px] text-white ${q.type === "single" ? "rounded-full" : "rounded"} ${on ? "border-navy bg-navy" : "border-black/25"}`}>{on && "✓"}</span>
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/5 px-6 py-4">
          {stage === "describe" ? (
            <><span className="text-[12px] text-ink-faint">Press Enter to continue</span><button className="btn-primary" disabled={!text.trim()} onClick={() => analyze()}>Continue →</button></>
          ) : stage === "ask" ? (
            <><button className="px-4 text-[15px] font-medium" onClick={() => (idx + 1 < queue.length ? setIdx(idx + 1) : finish(answers))}>Skip</button><button className="btn-primary !px-8" onClick={next}>{idx + 1 < queue.length ? "Next" : "See matches"}</button></>
          ) : <span />}
        </div>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(ui, document.body) : null;
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50"><LogoMark size={16} /></span>
      <div className="rounded-2xl rounded-tl-sm bg-black/[0.04] px-4 py-3 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}
export { catEmoji };
