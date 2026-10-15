"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, catLabel } from "@/lib/categories";
import { QUESTIONS, type Answers } from "@/lib/intake";

export default function SearchFilters({ service, answers }: { service: string; answers: Answers }) {
  const router = useRouter();
  const sp = useSearchParams();
  const qs = QUESTIONS[service] ?? [];
  const apply = (next: Answers) => {
    const p = new URLSearchParams(sp.toString());
    [...p.keys()].filter((k) => k.startsWith("a_")).forEach((k) => p.delete(k));
    for (const [k, v] of Object.entries(next)) if (v.length) p.set(`a_${k}`, v.join(","));
    router.replace(`/search?${p}`, { scroll: false });
  };
  const toggle = (id: string, v: string, single: boolean) => {
    const cur = answers[id] ?? [];
    apply({ ...answers, [id]: single ? (cur.includes(v) ? [] : [v]) : cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  if (service === "all" || !qs.length)
    return (
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Services</h3>
        <ul className="mt-3 space-y-1">{CATEGORIES.map((c) => <li key={c.slug}><Link className="block rounded-lg px-2 py-2 text-[15px] hover:bg-black/5" href={`/search?service=${c.slug}&city=${sp.get("city") ?? "Chicago"}`}>{c.emoji} {c.label}</Link></li>)}</ul>
      </div>
    );
  return (
    <div>
      <h3 className="text-xl font-semibold tracking-tight">{catLabel(service)}</h3>
      {qs.map((q) => (
        <fieldset key={q.id} className="mt-6">
          <legend className="text-[15px] font-semibold">{q.title.replace(/\?$/, "")}</legend>
          <div className="mt-2 space-y-1.5">
            {q.options.map((o) => {
              const on = (answers[q.id] ?? []).includes(o.value);
              return (
                <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink-soft">
                  <input type={q.type === "single" ? "radio" : "checkbox"} className="h-4 w-4 accent-navy" checked={on} onChange={() => toggle(q.id, o.value, q.type === "single")} onClick={() => q.type === "single" && on && toggle(q.id, o.value, true)} />
                  {o.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      {Object.keys(answers).length > 0 && <button onClick={() => apply({})} className="mt-6 text-[14px] font-medium text-brand-700 hover:underline">Reset filters</button>}
    </div>
  );
}
