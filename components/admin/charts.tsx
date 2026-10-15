"use client";
import { useState } from "react";

export function Card({ title, sub, children, className = "" }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-black/5 bg-white p-5 shadow-sm ${className}`}><h3 className="text-[15px] font-semibold">{title}</h3>{sub && <p className="text-[12.5px] text-ink-soft">{sub}</p>}<div className="mt-4">{children}</div></section>;
}
export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"><div className="text-[12.5px] text-ink-soft">{label}</div><div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>{hint && <div className="text-[12px] text-ink-faint">{hint}</div>}</div>;
}
// Vertical histogram / time series
export function Bars({ data, color = "#2251FF", height = 120, every = 1 }: { data: { label: string; n: number }[]; color?: string; height?: number; every?: number }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return <Empty />;
  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {data.map((d, i) => <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} title={`${d.label}: ${d.n}`} className="flex-1 rounded-t transition-opacity" style={{ height: `${Math.max(d.n ? 4 : 1, (d.n / max) * 100)}%`, background: d.n ? color : "#e5e7eb", opacity: hover === null || hover === i ? 1 : 0.5 }} />)}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-ink-faint"><span>{data[0].label}</span><span>{hover !== null ? `${data[hover].label}: ${data[hover].n}` : `peak ${max}`}</span><span>{data[data.length - 1].label}</span></div>
    </div>
  );
}
// Labelled horizontal bars
export function HBars({ rows, color = "#2251FF", suffix = "" }: { rows: { label: string; n: number; note?: string }[]; color?: string; suffix?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <Empty />;
  return <div className="space-y-2">{rows.map((r) => <div key={r.label}><div className="flex justify-between text-[13px]"><span className="truncate pr-2">{r.label}</span><span className="shrink-0 font-medium">{r.n}{suffix}{r.note && <span className="ml-1.5 font-normal text-ink-faint">{r.note}</span>}</span></div><div className="mt-1 h-2 rounded-full bg-black/5"><div className="h-2 rounded-full" style={{ width: `${(r.n / max) * 100}%`, background: color }} /></div></div>)}</div>;
}
export function Empty({ text = "No data yet" }: { text?: string }) { return <p className="py-6 text-center text-[13px] text-ink-faint">{text}</p>; }
