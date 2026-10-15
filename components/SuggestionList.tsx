"use client";
import { catEmoji, catLabel } from "@/lib/categories";
import type { Sug } from "@/lib/suggestions";

export default function SuggestionList({ items, text, onPick, onAsk, dark = false }: { items: Sug[]; text: string; onPick: (s: Sug) => void; onAsk: () => void; dark?: boolean }) {
  if (!text.trim()) return null;
  return (
    <ul className="max-h-72 divide-y divide-black/5 overflow-y-auto rounded-xl bg-white text-ink shadow-pop ring-1 ring-black/10" role="listbox">
      {items.map((s) => (
        <li key={s.label}>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(s)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] hover:bg-brand-50">
            <span className="text-lg">{catEmoji(s.category)}</span>
            <span className="flex-1">{s.label}</span>
            <span className="text-[12px] text-ink-faint">{catLabel(s.category)}</span>
          </button>
        </li>
      ))}
      <li>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onAsk} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-brand-700 hover:bg-brand-50">
          <span className="text-lg">✨</span><span className="flex-1">Ask the assistant: “{text.length > 48 ? text.slice(0, 48) + "…" : text}”</span><span>→</span>
        </button>
      </li>
    </ul>
  );
}
