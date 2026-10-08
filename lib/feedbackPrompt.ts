import { describeRoute } from "./routeMap";

export type FB = {
  id: string; created_at: string; reporter?: string | null; category: string; comment: string;
  path?: string | null; url?: string | null; target?: any; selected_text?: string | null;
  screenshot?: string | null; has_screenshot?: boolean; viewport?: any; note?: string | null;
};

const CRITERIA: Record<string, string> = {
  bug: "The problem no longer reproduces on the page described; no regressions on neighbouring features; handle loading/empty/error states.",
  design: "The result visually matches the intent (see screenshot/element); consistent with existing design tokens (kiwi colors, rounded-3xl cards, .btn-* classes); looks right at mobile (375px) and desktop widths.",
  copy: "Text is changed exactly where described, in the same tone (friendly, concise, Apple-like); no layout breakage from longer/shorter text.",
  idea: "The new behaviour works end-to-end for signed-in and signed-out users where relevant; follows existing patterns; any new DB needs are added as a SQL file in supabase/ and clearly flagged.",
};
const VAGUE = /\b(better|nicer|improve|fix this|make it|cleaner|prettier|weird|off|bad)\b/i;

export function buildPrompt(items: FB[], extra?: string) {
  const warnings: string[] = [];
  const body = items.map((f, i) => {
    const r = describeRoute(f.path || "/");
    const t = f.target;
    const words = f.comment.trim().split(/\s+/).length;
    const lines: string[] = [];
    lines.push(`### ${i + 1}. [${f.category.toUpperCase()}] ${f.comment.trim()}`);
    lines.push(`- Feedback ID: ${f.id}`);
    lines.push(`- Page: ${f.path || "/"}  (${r.name})`);
    lines.push(`- Likely files: ${r.files.join(", ")}`);
    if (t) {
      lines.push(`- Pointed-at element: \`${t.selector}\` (<${t.tag}>)`);
      if (t.text) lines.push(`- Element text: "${String(t.text).slice(0, 160)}"`);
      if (t.html) lines.push(`- Rendered HTML snippet: \`${String(t.html).slice(0, 240)}\``);
      lines.push(`  (Tailwind classes in the snippet are the best string to grep for.)`);
    }
    if (f.selected_text) lines.push(`- User highlighted text: "${f.selected_text.slice(0, 200)}" (grep for this exact string)`);
    if (f.has_screenshot || f.screenshot) lines.push(`- Screenshot: yes — download from the Kiwi feedback tracker (item ${f.id.slice(0, 8)}) and attach it to this chat.`);
    if (f.viewport) lines.push(`- Viewport when reported: ${f.viewport.w}×${f.viewport.h}${f.viewport.w < 640 ? " (mobile)" : ""}`);
    if (f.note) lines.push(`- Prior note: ${f.note}`);
    lines.push(`- Acceptance criteria: ${CRITERIA[f.category] ?? CRITERIA.idea}`);
    if (words < 6 && !t && !f.screenshot && !f.has_screenshot) {
      warnings.push(`Item ${i + 1} is very short and has no element or screenshot attached — scope may be ambiguous.`);
      lines.push(`- ⚠ Ambiguous: little context was provided. State your interpretation before changing code.`);
    } else if (VAGUE.test(f.comment) && !t && !f.screenshot && !f.has_screenshot) {
      warnings.push(`Item ${i + 1} uses vague wording ("${f.comment.match(VAGUE)![0]}") with no target attached.`);
      lines.push(`- ⚠ Vague wording: propose a concrete interpretation first.`);
    }
    return lines.join("\n");
  }).join("\n\n");

  const prompt = `# Task: implement ${items.length} user feedback item${items.length > 1 ? "s" : ""} on Kiwi

## Project context
Kiwi is a trusted-services marketplace (live at https://kiwi-mu-red.vercel.app). Stack: Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase (Auth, Postgres with RLS, Storage), deployed on Vercel. Design language: clean, Apple-like, kiwi-green accent (tailwind \`kiwi-*\`), rounded-3xl white cards, helper classes in app/globals.css (.btn-primary, .btn-ghost, .card, .input, .label). Server pages use lib/supabase/server.ts; client components use lib/supabase/client.ts.

## Feedback items
${body}
${extra?.trim() ? `\n## Extra instructions from the product owner\n${extra.trim()}\n` : ""}
## How to work
1. For each item, find the code (use the likely files and grep for the quoted text/classes). Briefly state your plan and any assumption before editing.
2. Make the smallest change that satisfies the acceptance criteria. Don't refactor unrelated code or change behaviour outside these items.
3. Keep it responsive and accessible (labels, contrast, focus states).
4. If a database change is needed, add a new SQL file in supabase/ and tell me exactly what to run; never edit existing migrations silently.
5. Run \`npm run build\` and fix any errors.
6. Commit with a message like "feedback: <short summary>" and list which feedback IDs you completed: ${items.map((f) => f.id.slice(0, 8)).join(", ")}.`;
  return { prompt, warnings };
}

export const REFINE_SYSTEM = `You are an expert prompt engineer writing prompts for Claude Code, an autonomous coding agent working in the Kiwi repo.
You receive a draft prompt built from raw user feedback (plus screenshots when available). Rewrite it into the best possible prompt:
- Keep the structure (context, items, how to work) and keep all feedback IDs and file hints.
- Make each item precise: what to change, where (files/components, using the route and element selector hints), and concrete acceptance criteria. Use the screenshots to describe what you see.
- Resolve vague wording into a concrete proposed interpretation; list remaining uncertainties under "Assumptions / questions" instead of inventing features.
- Order items sensibly, group related ones, call out dependencies.
- Do not add features not implied by the feedback. Do not include commentary outside the prompt.
Output ONLY the final prompt in markdown.`;
