"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Stat } from "./charts";

// Mirrors the founders' revenue spreadsheet. Counts are seeded from live data; every parameter is editable.
const D = { tx: 0.1, cost: 70, fee: 2, subPct: 10, subPrice: 5, upS: 50, promoPct: 10, promoPrice: 30, listPct: 2, listPrice: 20, premPct: 10, premPrice: 2.5 };
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function RevenueTab() {
  const s = createClient();
  const [p, setP] = useState(D);
  const [users, setUsers] = useState(1000);
  const [live, setLive] = useState<{ users: number; suppliers: number } | null>(null);
  const [schedule, setSchedule] = useState({ premium_start: "2027-01-01" });
  const [msg, setMsg] = useState("");
  useEffect(() => {
    s.rpc("admin_overview", { days: 30 }).then(({ data }) => { if (data) { setLive({ users: data.totals.customers, suppliers: data.totals.suppliers }); if (data.totals.customers) setUsers(data.totals.customers); } });
    s.from("app_settings").select("value").eq("key", "premium_start").maybeSingle().then(({ data }) => data && setSchedule({ premium_start: String(data.value) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const suppliers = Math.max(1, Math.round(users / p.upS));
  const txs = users * p.tx;
  const rows = [
    ["Booking fees", "Transactions × avg cost × fee %", txs * p.cost * (p.fee / 100)],
    ["Fee-avoidance / invoicing subscription", "Suppliers × % willing × price", suppliers * (p.subPct / 100) * p.subPrice],
    ["Promotion (Google model)", "Suppliers × % willing × price", suppliers * (p.promoPct / 100) * p.promoPrice],
    ["Lead / mailing list", "Suppliers × % willing × price", suppliers * (p.listPct / 100) * p.listPrice],
    ["Premium users (own filters, more communities)", "Users × % willing × price", users * (p.premPct / 100) * p.premPrice],
  ] as [string, string, number][];
  const monthly = rows.reduce((a, r) => a + r[2], 0);
  const stripePerTx = p.cost * 0.029 + 0.3;
  const feePerTx = p.cost * (p.fee / 100);
  const num = (k: keyof typeof D, label: string, step = 1) => (
    <label key={k} className="block text-[12.5px] text-ink-soft">{label}<input type="number" step={step} min={0} value={p[k]} onChange={(e) => setP({ ...p, [k]: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink outline-none" /></label>
  );
  async function saveDate() {
    const { error } = await s.rpc("admin_set_setting", { k: "premium_start", v: schedule.premium_start });
    setMsg(error ? error.message : "Saved. Premium limits apply from this date; everything is free before it.");
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Modeled monthly revenue" value={usd(monthly)} hint={`${usd(monthly * 12)} / year`} />
        <Stat label="Users modeled" value={users.toLocaleString()} hint={live ? `live: ${live.users} customers` : ""} />
        <Stat label="Suppliers modeled" value={suppliers} hint={live ? `live: ${live.suppliers}` : ""} />
        <Stat label="Transactions / month" value={txs.toFixed(0)} />
      </div>
      {feePerTx < stripePerTx && (
        <p className="rounded-2xl bg-red-50 p-4 text-[13.5px] text-red-800">⚠ Unit economics: at {p.fee}% on a {usd(p.cost)} job you earn {usd(feePerTx)}, but card processing (≈2.9% + 30¢) costs ≈{usd(stripePerTx)}. Charging less than ≈{((stripePerTx / p.cost) * 100 + 1).toFixed(1)}% loses money per booking unless suppliers pay the processing fee separately.</p>
      )}
      <Card title="Revenue streams" sub="Same structure as your spreadsheet">
        <table className="w-full text-[13.5px]"><tbody>{rows.map(([n, f, v]) => <tr key={n} className="border-t border-black/5"><td className="py-2 font-medium">{n}<div className="text-[12px] font-normal text-ink-faint">{f}</div></td><td className="text-right font-semibold">{usd(v)}</td></tr>)}<tr className="border-t-2 border-black/10"><td className="py-2 font-semibold">Total / month</td><td className="text-right font-semibold">{usd(monthly)}</td></tr></tbody></table>
      </Card>
      <Card title="Assumptions" sub="Edit to run scenarios">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-[12.5px] text-ink-soft">Total users<input type="number" min={1} value={users} onChange={(e) => setUsers(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink outline-none" /></label>
          {num("tx", "Transactions per user / month", 0.05)}{num("cost", "Avg transaction ($)")}{num("fee", "Booking fee (%)", 0.1)}
          {num("upS", "Users per supplier")}{num("subPct", "% suppliers on fee-avoidance sub")}{num("subPrice", "Fee-avoidance price ($)", 0.5)}
          {num("promoPct", "% suppliers buying promotion")}{num("promoPrice", "Promotion price ($)")}{num("listPct", "% suppliers in lead list")}
          {num("listPrice", "Lead list price ($)")}{num("premPct", "% users on Premium")}{num("premPrice", "Premium price ($)", 0.5)}
        </div>
      </Card>
      <Card title="Rollout schedule" sub="Nov: Booth, all free · Dec: all of UChicago, all free · Jan: revenue starts">
        <label className="block text-[13px] text-ink-soft">Premium & fees start on<input type="date" value={schedule.premium_start} onChange={(e) => setSchedule({ premium_start: e.target.value })} className="mt-1 rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink outline-none" /></label>
        <button className="btn-primary mt-3 !py-2" onClick={saveDate}>Save date</button>
        {msg && <p className="mt-2 text-[13px] text-brand-700">{msg}</p>}
      </Card>
    </div>
  );
}
