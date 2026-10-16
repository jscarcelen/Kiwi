"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CITIES } from "@/lib/categories";
import { toE164, validPhone } from "@/lib/phone";
import { initials } from "@/lib/data";
import DeleteAccount from "./DeleteAccount";
import BlockedList from "./BlockedList";
import PasswordInput from "./PasswordInput";

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return <section className="card p-6"><h2 className="text-xl font-semibold tracking-tight">{title}</h2>{desc && <p className="mt-1 text-[14px] text-ink-soft">{desc}</p>}<div className="mt-4 space-y-4">{children}</div></section>;
}
const Msg = ({ m }: { m: string }) => (m ? <p className={`text-[13px] ${m.startsWith("✓") ? "text-emerald-700" : "text-red-600"}`}>{m}</p> : null);

export default function SettingsForm({ user, profile, phoneRow, provider }: { user: { id: string; email: string; phone: string }; profile: any; phoneRow: any; provider: any }) {
  const router = useRouter();
  const s = createClient();
  // profile
  const [name, setName] = useState(profile?.full_name ?? ""); const [insta, setInsta] = useState(profile?.instagram ?? ""); const [city, setCity] = useState(profile?.city ?? "Chicago");
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null); const [pMsg, setPMsg] = useState("");
  // sign-in
  const [email, setEmail] = useState(user.email); const [eMsg, setEMsg] = useState("");
  const [pw, setPw] = useState(""); const [pwMsg, setPwMsg] = useState("");
  const [phone, setPhone] = useState(""); const [code, setCode] = useState(""); const [sent, setSent] = useState(false); const [phMsg, setPhMsg] = useState("");
  const [disc, setDisc] = useState<boolean>(phoneRow?.discoverable ?? true);
  // provider
  const [pr, setPr] = useState({ company: provider?.company ?? "", contact_name: provider?.contact_name ?? "", description: provider?.description ?? "", phone: provider?.phone ?? "", category: provider?.category ?? "cleaning", regions: (provider?.regions ?? []) as string[] });
  const [prMsg, setPrMsg] = useState("");

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setPMsg("");
    const { error } = await s.from("profiles").update({ full_name: name.trim(), instagram: insta.replace("@", "").trim() || null, city }).eq("id", user.id);
    if (error) return setPMsg(error.message);
    await s.auth.updateUser({ data: { full_name: name.trim() } });
    setPMsg("✓ Saved"); router.refresh();
  };
  const upload = async (file?: File | null) => {
    if (!file) return; setPMsg("Uploading…");
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
    const up = await s.storage.from("avatars").upload(path, file, { upsert: true });
    if (up.error) return setPMsg(up.error.message);
    const url = s.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const { error } = await s.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    if (error) return setPMsg(error.message);
    setAvatar(url); setPMsg("✓ Photo updated"); router.refresh();
  };
  const saveEmail = async () => { setEMsg(""); const { error } = await s.auth.updateUser({ email: email.trim() }); setEMsg(error ? error.message : "✓ Check your new email to confirm the change."); };
  const savePw = async () => { setPwMsg(""); if (pw.length < 6) return setPwMsg("Use at least 6 characters."); const { error } = await s.auth.updateUser({ password: pw }); setPwMsg(error ? error.message : "✓ Password updated."); if (!error) setPw(""); };
  const sendCode = async () => { setPhMsg(""); if (!validPhone(phone)) return setPhMsg("Enter a valid phone number."); const { error } = await s.auth.updateUser({ phone: toE164(phone) }); if (error) return setPhMsg(error.message); setSent(true); };
  const verify = async () => { const { error } = await s.auth.verifyOtp({ phone: toE164(phone), token: code.trim(), type: "phone_change" }); if (error) return setPhMsg(error.message); await s.rpc("sync_my_phone"); setSent(false); setPhMsg("✓ Phone verified."); router.refresh(); };
  const saveProvider = async (e: React.FormEvent) => {
    e.preventDefault(); setPrMsg("");
    const { error } = await s.from("providers").update({ company: pr.company, description: pr.description, category: pr.category, regions: pr.regions, city: pr.regions[0] ?? provider.city }).eq("id", provider.id);
    // Contact details are shared by all of this account's services.
    const shared = error ? null : await s.from("providers").update({ contact_name: pr.contact_name, phone: pr.phone }).eq("owner_id", user.id);
    setPrMsg(error ? error.message : shared?.error ? shared.error.message : "✓ Saved");
  };
  const uploadProviderPhoto = async (file?: File | null) => {
    if (!file) return; setPrMsg("Uploading…");
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
    const up = await s.storage.from("provider-photos").upload(path, file);
    if (up.error) return setPrMsg(up.error.message);
    const url = s.storage.from("provider-photos").getPublicUrl(path).data.publicUrl;
    const { error } = await s.from("providers").update({ photo_url: url }).eq("id", provider.id);
    setPrMsg(error ? error.message : "✓ Business photo updated");
  };

  return (
    <div className="space-y-5">
      <Card title="Profile" desc="How you appear to friends and communities.">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy text-2xl font-semibold text-white">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials(name || "?")}</div>
          <label className="btn-ghost cursor-pointer !py-2 !text-[14px]">Change photo<input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} /></label>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <div><label className="label">Full name</label><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Instagram</label><input className="input" placeholder="@handle" value={insta} onChange={(e) => setInsta(e.target.value)} /></div>
            <div><label className="label">City</label><select className="input" value={city} onChange={(e) => setCity(e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <button className="btn-primary !py-2.5">Save profile</button><Msg m={pMsg} />
        </form>
      </Card>

      <Card title="Sign-in details">
        <div><label className="label">Email</label><div className="flex gap-2"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Add an email" /><button className="btn-ghost shrink-0" onClick={saveEmail} disabled={!email || email === user.email}>Update</button></div><Msg m={eMsg} /></div>
        <div><label className="label">New password</label><div className="flex gap-2"><div className="flex-1"><PasswordInput minLength={6} value={pw} onChange={setPw} placeholder="At least 6 characters" autoComplete="new-password" /></div><button className="btn-ghost shrink-0" onClick={savePw} disabled={!pw}>Update</button></div><Msg m={pwMsg} /></div>
        <div><label className="label">Phone {user.phone && <span className="font-normal text-ink-faint">· current: +{user.phone}</span>}</label>
          <div className="flex flex-wrap gap-2">
            <input className="input !w-56" inputMode="tel" placeholder="(312) 555-0123" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {!sent ? <button className="btn-ghost" onClick={sendCode}>{user.phone ? "Change number" : "Verify number"}</button> : <><input className="input !w-32 text-center tracking-widest" inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} /><button className="btn-primary" onClick={verify}>Confirm</button></>}
          </div><Msg m={phMsg} /></div>
      </Card>

      {phoneRow && (
        <Card title="Privacy">
          <label className="flex items-start gap-3 text-[14px]"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-500" checked={disc} onChange={async (e) => { setDisc(e.target.checked); await s.from("phone_numbers").update({ discoverable: e.target.checked }).eq("user_id", user.id); }} /><span><b>Let friends find me by phone number.</b><br /><span className="text-ink-soft">People with your number in their contacts can see you're on WOM.</span></span></label>
          <p className="text-[13px] text-ink-faint">Community sharing is managed per community on <a className="underline" href="/network#communities">My network</a>; review sharing is chosen each time you rate a pro.</p>
        </Card>
      )}

      {provider && (
        <Card title="Your pro profile" desc={`Shown to customers on WOM. `}>
          <form onSubmit={saveProvider} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Business name</label><input className="input" required value={pr.company} onChange={(e) => setPr({ ...pr, company: e.target.value })} /></div>
              <div><label className="label">Contact name</label><input className="input" value={pr.contact_name} onChange={(e) => setPr({ ...pr, contact_name: e.target.value })} /></div>
              <div><label className="label">Public phone</label><input className="input" value={pr.phone} onChange={(e) => setPr({ ...pr, phone: e.target.value })} /></div>
              <div><label className="label">Service</label><select className="input" value={pr.category} onChange={(e) => setPr({ ...pr, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></div>
            </div>
            <div><label className="label">Regions you serve</label><div className="flex flex-wrap gap-2">{CITIES.map((c) => { const on = pr.regions.includes(c); return <button type="button" key={c} onClick={() => setPr({ ...pr, regions: on ? pr.regions.filter((x) => x !== c) : [...pr.regions, c] })} className={`rounded-full px-4 py-2 text-[14px] ${on ? "bg-navy text-white" : "bg-black/5"}`}>{c}</button>; })}</div></div>
            <div><label className="label">Description</label><textarea className="input min-h-[100px]" value={pr.description} onChange={(e) => setPr({ ...pr, description: e.target.value })} /></div>
            <div><label className="label">Business photo / logo</label><input type="file" accept="image/*" onChange={(e) => uploadProviderPhoto(e.target.files?.[0])} className="block w-full text-[14px] file:mr-3 file:rounded-full file:border-0 file:bg-black/5 file:px-4 file:py-2" /></div>
            <button className="btn-primary !py-2.5" disabled={pr.regions.length === 0}>Save pro profile</button><Msg m={prMsg} />
            <p className="text-[12px] text-ink-faint">This is your first service. Offer more (like cleaning and dog walking) and edit what each one offers from your <a className="underline" href="/provider/dashboard">dashboard</a>.</p>
          </form>
        </Card>
      )}

      <Card title="Blocked people"><BlockedList /></Card>

      <Card title="Account">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="font-semibold">Delete my account</div><p className="text-[13px] text-ink-soft">Permanently removes your profile, reviews, connections and communities you own. This can't be undone.</p></div>
          <div className="rounded-full border border-red-200 px-4 py-2"><DeleteAccount /></div>
        </div>
      </Card>
    </div>
  );
}
