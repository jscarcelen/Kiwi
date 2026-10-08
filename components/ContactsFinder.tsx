"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseContacts, toE164, toDigits, validPhone, type Contact } from "@/lib/phone";
import { Avatar } from "./ui";

type Match = { id: string; full_name: string; instagram: string | null; phone: string };

export default function ContactsFinder({ me, friendIds }: { me: string; friendIds: string[] }) {
  const router = useRouter();
  const s = createClient();
  const [own, setOwn] = useState<{ phone: string; discoverable: boolean } | null | undefined>(undefined);
  const [phone, setPhone] = useState(""); const [code, setCode] = useState(""); const [sent, setSent] = useState(false);
  const [paste, setPaste] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [others, setOthers] = useState<Contact[]>([]);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const canPick = typeof navigator !== "undefined" && "contacts" in navigator && typeof window !== "undefined" && "ContactsManager" in window;
  const invite = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${me}` : "";
  const inviteMsg = `Join me on Kiwi — see which local services our friends trust: ${invite}`;

  const loadOwn = async () => {
    await s.rpc("sync_my_phone");
    const { data } = await s.from("phone_numbers").select("phone,discoverable").eq("user_id", me).maybeSingle();
    setOwn(data ?? null);
  };
  useEffect(() => { loadOwn(); }, []); // eslint-disable-line

  const sendCode = async () => {
    setMsg("");
    if (!validPhone(phone)) return setMsg("Enter a valid phone number.");
    const { error } = await s.auth.updateUser({ phone: toE164(phone) });
    if (error) return setMsg(error.message); setSent(true);
  };
  const verify = async () => {
    const { error } = await s.auth.verifyOtp({ phone: toE164(phone), token: code.trim(), type: "phone_change" });
    if (error) return setMsg(error.message);
    await loadOwn(); setSent(false); setMsg("Phone verified ✓");
  };

  const run = async (list: Contact[]) => {
    if (!list.length) return setMsg("No phone numbers found.");
    setBusy(true); setMsg("");
    const mine = own?.phone;
    const nums = list.map((c) => c.num).filter((n) => n !== mine);
    const { data, error } = await s.rpc("match_contacts", { nums });
    setBusy(false);
    if (error) return setMsg(error.message);
    const found: Match[] = data ?? [];
    setMatches(found);
    const foundPhones = new Set(found.map((m) => m.phone));
    setOthers(list.filter((c) => !foundPhones.has(c.num)));
  };
  const pick = async () => {
    try {
      const res = await (navigator as any).contacts.select(["name", "tel"], { multiple: true });
      await run(res.flatMap((c: any) => (c.tel ?? []).map((t: string) => ({ name: c.name?.[0] ?? "", num: toDigits(t) }))).filter((c: Contact) => c.num.length >= 10));
    } catch { /* cancelled */ }
  };
  const onFile = async (f?: File | null) => { if (f) await run(parseContacts(await f.text())); };
  const fresh = (matches ?? []).filter((m) => !friendIds.includes(m.id));
  const addAll = async (ids: string[]) => { for (const id of ids) await s.rpc("add_friend", { target: id }); router.refresh(); setMatches((m) => m); };

  return (
    <section className="card mt-8 p-6">
      <h2 className="text-2xl font-semibold tracking-tight">Find friends from your contacts</h2>
      <p className="mt-1 text-[14px] text-ink-soft">We match phone numbers on the spot and never store your contact list.</p>

      {own === undefined ? null : !own ? (
        <div className="mt-4 rounded-2xl bg-kiwi-50 p-4">
          <p className="text-[14px]"><b>Verify your phone</b> so friends can find you and connections can be traced.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input className="input !w-56" placeholder="(312) 555-0123" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {!sent ? <button className="btn-primary" onClick={sendCode}>Text me a code</button> : (
              <><input className="input !w-32 text-center tracking-widest" placeholder="123456" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} /><button className="btn-primary" onClick={verify}>Verify</button></>
            )}
          </div>
        </div>
      ) : (
        <label className="mt-4 flex items-center gap-2 text-[14px]">
          <input type="checkbox" className="accent-kiwi-600" checked={own.discoverable} onChange={async (e) => { await s.from("phone_numbers").update({ discoverable: e.target.checked }).eq("user_id", me); setOwn({ ...own, discoverable: e.target.checked }); }} />
          Let people with my number in their contacts find me on Kiwi (+{own.phone.slice(0, 1)}•••{own.phone.slice(-2)})
        </label>
      )}
      {msg && <p className="mt-3 text-[13px] text-ink-soft">{msg}</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {canPick && <button className="btn-primary" onClick={pick} disabled={busy}>📇 Choose from my contacts</button>}
        <label className="btn-ghost cursor-pointer">📄 Upload contacts file (.vcf / .csv)<input type="file" accept=".vcf,.csv,text/vcard,text/csv,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>
      </div>
      {!canPick && <p className="mt-2 text-[12px] text-ink-faint">iPhone tip: on icloud.com → Contacts → select all → Export vCard, then upload the file here. Or paste numbers below. (Direct contact access needs a native app.)</p>}
      <textarea className="input mt-3 min-h-[70px]" placeholder="Or paste numbers / names, one per line" value={paste} onChange={(e) => setPaste(e.target.value)} />
      {paste.trim() && <button className="btn-ghost mt-2" onClick={() => run(parseContacts(paste))} disabled={busy}>Find them</button>}

      {matches && (
        <div className="mt-6">
          <div className="flex items-center justify-between"><h3 className="font-semibold">{matches.length} of your contacts {matches.length === 1 ? "is" : "are"} on Kiwi</h3>
            {fresh.length > 1 && <button className="btn-primary !py-1.5 !text-[14px]" onClick={() => addAll(fresh.map((m) => m.id))}>Add all ({fresh.length})</button>}</div>
          <ul className="mt-2 divide-y divide-black/5">
            {matches.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-3"><Avatar id={m.id} name={m.full_name} /> {m.full_name}</span>
                {friendIds.includes(m.id) ? <span className="text-[13px] text-ink-faint">Connected</span> : <button className="btn-ghost !py-1.5 !text-[14px]" onClick={() => addAll([m.id])}>Add</button>}
              </li>
            ))}
          </ul>
          {others.length > 0 && (
            <div className="mt-5">
              <h3 className="font-semibold">Invite the rest ({others.length})</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn-ghost !py-1.5 !text-[14px]" onClick={async () => { if (navigator.share) await navigator.share({ text: inviteMsg }); else { await navigator.clipboard.writeText(inviteMsg); setMsg("Invite message copied."); } }}>Share invite link</button>
              </div>
              <ul className="mt-2 max-h-56 divide-y divide-black/5 overflow-y-auto">
                {others.slice(0, 50).map((c) => (
                  <li key={c.num} className="flex items-center justify-between py-2 text-[14px]"><span>{c.name || `+${c.num}`}</span><a className="text-kiwi-700 underline" href={`sms:+${c.num}?&body=${encodeURIComponent(inviteMsg)}`}>Invite by text</a></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
