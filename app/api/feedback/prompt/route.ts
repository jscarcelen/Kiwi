import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPrompt, REFINE_SYSTEM } from "@/lib/feedbackPrompt";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createClient();
  const { ids, extra, refine } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "No items selected" }, { status: 400 });
  if (ids.length > 20) return NextResponse.json({ error: "Select 20 items or fewer" }, { status: 400 });
  const { data: items, error } = await supabase.from("feedback").select("*").in("id", ids).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { prompt, warnings } = buildPrompt(items ?? [], extra);

  const key = process.env.OPENAI_API_KEY;
  if (!refine) return NextResponse.json({ prompt, refined: false, warnings });
  if (!key) return NextResponse.json({ prompt, refined: false, warnings, note: "Add OPENAI_API_KEY in Vercel env vars (and redeploy) to enable AI refinement. Showing the structured prompt instead." });
  try {
    const images = (items ?? []).filter((f: any) => f.screenshot).slice(0, 4).flatMap((f: any) => [
      { type: "text", text: `Screenshot for feedback ${f.id.slice(0, 8)}:` },
      { type: "image_url", image_url: { url: f.screenshot } },
    ]);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        max_completion_tokens: 4000,
        messages: [
          { role: "system", content: REFINE_SYSTEM },
          { role: "user", content: [...images, { type: "text", text: `Draft prompt to improve:\n\n${prompt}` }] },
        ],
      }),
    });
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content;
    if (!res.ok || !text) throw new Error(json?.error?.message || "No response");
    return NextResponse.json({ prompt: text, base: prompt, refined: true, warnings });
  } catch (e: any) {
    return NextResponse.json({ prompt, refined: false, warnings, note: `AI refinement failed (${e.message}). Showing the structured prompt instead.` });
  }
}
