"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GalleryUpload({ providerId, userId, initial }: { providerId: string; userId: string; initial: string[] }) {
  const [photos, setPhotos] = useState<string[]>(initial);
  const [msg, setMsg] = useState("");
  const s = createClient();
  const save = async (next: string[]) => {
    const { error } = await s.from("providers").update({ photos: next }).eq("id", providerId);
    if (error) return setMsg(error.message);
    setPhotos(next); setMsg("✓ Saved");
  };
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setMsg("Uploading…");
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 8 - photos.length)) {
      if (f.size > 8 * 1024 * 1024) { setMsg("Photos must be under 8 MB."); continue; }
      const path = `${userId}/gallery-${Date.now()}-${f.name.replace(/[^\w.]/g, "_")}`;
      const up = await s.storage.from("provider-photos").upload(path, f);
      if (up.error) { setMsg(up.error.message); continue; }
      urls.push(s.storage.from("provider-photos").getPublicUrl(path).data.publicUrl);
    }
    if (urls.length) await save([...photos, ...urls]);
  };
  return (
    <div>
      <label className="label">Photo gallery <span className="font-normal text-ink-faint">({photos.length}/8) — show your work</span></label>
      <div className="flex flex-wrap gap-2">
        {photos.map((u) => (
          <div key={u} className="relative h-20 w-20 overflow-hidden rounded-xl bg-black/5">
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button type="button" aria-label="Remove photo" onClick={() => save(photos.filter((x) => x !== u))} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[11px] text-white">✕</button>
          </div>
        ))}
        {photos.length < 8 && <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-black/15 text-2xl text-ink-faint hover:bg-black/5">＋<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} /></label>}
      </div>
      {msg && <p className="mt-1 text-[13px] text-ink-soft">{msg}</p>}
    </div>
  );
}
