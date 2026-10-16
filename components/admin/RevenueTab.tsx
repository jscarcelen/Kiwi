"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Stat } from "./charts";

// Business model for a Spain-based company selling worldwide. All figures in USD unless noted; every input is editable.
// Defaults for processor fees come from public pricing (Paddle 5% + $0.50; Stripe EEA cards 1.5% + €0.25, non-EEA ≈3.25%; Apple 15% small-business). Cost lines are placeholders to replace with real quotes.
const D = {
  // demand
  tx: 0.1, cost: 70, fee: 4, upS: 50,
  subPct: 10, subPrice: 5, promoPct: 10, promoPrice: 30, listPct: 2, listPrice: 20, premPct: 10, premPrice: 2.5,
  // payments
  feeOnTop: 1, intlShare: 30, iosShare: 60, refunds: 2, eur: 0.92,
  // variable costs
  smsPerUser: 0.08, perActive: 0.05,
  // fixed monthly costs
  infra: 55, tools: 40, apple: 8.25, gestoria: 150, legal: 100, support: 100, marketing: 300, insurance: 30,
  // tax
  tax: 15,
};
type P = typeof D;
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct1 = (n: number) => `${n.toFixed(0)}%`;

function model(u: number, p: P, proc: { sub: string; promo: string; list: string }) {
  const suppliers = Math.max(1, u / p.upS);
  const txs = u * p.tx;
  const fx = 1 / p.eur; // € → $
  const cardPct = (1 - p.intlShare / 100) * 0.015 + (p.intlShare / 100) * 0.0325;
  const stripeTx = (amt: number) => amt * cardPct + 0.25 * fx;     // processing on a card payment
  const paddleTx = (amt: number) => amt * 0.05 + 0.5;
  const fee = (kind: string, amt: number) => (kind === "paddle" ? paddleTx(amt) : stripeTx(amt));

  // bookings via Stripe Connect: fee is charged on top of the job price (customer pays cost + fee) or deducted from supplier payout
  const bookGross = txs * p.cost * (p.fee / 100);
  const gross = p.feeOnTop ? p.cost + p.cost * (p.fee / 100) : p.cost;
  const bookProc = txs * stripeTx(gross);
  // when fee is on top, supplier bears nothing extra; WOM pays Stripe on the full charge, so net = fee - processing(total)
  const rows = [
    { name: "Booking fee (Stripe Connect)", gross: bookGross, proc: bookProc, note: p.feeOnTop ? "Fee added on top; WOM pays card processing on full charge" : "Fee deducted from supplier payout; WOM pays processing" },
  ];
  const subN = suppliers * (p.subPct / 100), promoN = suppliers * (p.promoPct / 100), listN = suppliers * (p.listPct / 100), premN = u * (p.premPct / 100);
  rows.push({ name: "Supplier fee-avoidance / invoicing sub", gross: subN * p.subPrice, proc: subN * fee(proc.sub, p.subPrice), note: proc.sub === "paddle" ? "Paddle 5% + $0.50 / payment" : "Stripe" });
  rows.push({ name: "Promotion (sponsored placement)", gross: promoN * p.promoPrice, proc: promoN * fee(proc.promo, p.promoPrice), note: proc.promo === "paddle" ? "⚠ Paddle may reject advertising/marketplace models" : "Stripe" });
  rows.push({ name: "Lead / mailing list", gross: listN * p.listPrice, proc: listN * fee(proc.list, p.listPrice), note: proc.list === "paddle" ? "⚠ Paddle may reject lead selling" : "Stripe" });
  const ios = p.iosShare / 100;
  rows.push({ name: "Premium users", gross: premN * p.premPrice, proc: premN * (ios * p.premPrice * 0.15 + (1 - ios) * paddleTx(p.premPrice)), note: `${p.iosShare}% via Apple IAP (15%), rest Paddle (5% + $0.50)` });

  const grossTotal = rows.reduce((a, r) => a + r.gross, 0);
  const procTotal = rows.reduce((a, r) => a + r.proc, 0);
  const refunds = grossTotal * (p.refunds / 100);
  const net = grossTotal - procTotal - refunds;
  const variable = u * p.perActive + u * 0.05 * p.smsPerUser * 20; // ~5% of base is new each month; plus OTP SMS
  const fixed = p.infra + p.tools + p.apple + p.gestoria + p.legal + p.support + p.marketing + p.insurance;
  const ebitda = net - variable - fixed;
  const tax = Math.max(0, ebitda) * (p.tax / 100);
  return { rows, grossTotal, procTotal, refunds, net, variable, fixed, ebitda, tax, income: ebitda - tax, suppliers, txs };
}

export default function RevenueTab() {
  const s = createClient();
  const [p, setP] = useState<P>(D);
  const [users, setUsers] = useState(1000);
  const [proc, setProc] = useState({ sub: "paddle", promo: "stripe", list: "stripe" });
  const [live, setLive] = useState<{ users: number; suppliers: number } | null>(null);
  const [start, setStart] = useState("2027-01-01");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    s.rpc("admin_overview", { days: 30 }).then(({ data }) => { if (data) { setLive({ users: data.totals.customers, suppliers: data.totals.suppliers }); } });
    s.from("app_settings").select("value").eq("key", "premium_start").maybeSingle().then(({ data }) => data && setStart(String(data.value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const m = useMemo(() => model(users, p, proc), [users, p, proc]);
  const breakEven = useMemo(() => { for (let u = 50; u <= 500000; u = Math.ceil(u * 1.03)) if (model(u, p, proc).ebitda > 0) return u; return null; }, [p, proc]);
  const scen = [500, 2000, 10000, 50000];
  const set = (k: keyof P, label: string, step = 1) => (
    <label key={k} className="block text-[12.5px] text-ink-soft">{label}<input type="number" step={step} min={0} value={p[k]} onChange={(e) => setP({ ...p, [k]: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink outline-none" /></label>
  );
  const sel = (k: "sub" | "promo" | "list", label: string) => (
    <label key={k} className="block text-[12.5px] text-ink-soft">{label}<select value={proc[k]} onChange={(e) => setProc({ ...proc, [k]: e.target.value })} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink"><option value="paddle">Paddle</option><option value="stripe">Stripe</option></select></label>
  );
  const eur = (n: number) => `€${Math.round(n * p.eur).toLocaleString()}`;
  async function saveDate() {
    const { error } = await s.rpc("admin_set_setting", { k: "premium_start", v: start });
    setMsg(error ? error.message : "Saved.");
  }
  const perTxProc = (() => { const c = (1 - p.intlShare / 100) * 0.015 + (p.intlShare / 100) * 0.0325; const amt = p.feeOnTop ? p.cost * (1 + p.fee / 100) : p.cost; return amt * c + 0.25 / p.eur; })();
  const perTxFee = p.cost * (p.fee / 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Net revenue / month" value={usd(m.net)} hint={`gross ${usd(m.grossTotal)} · ${eur(m.net)}`} />
        <Stat label="Profit before tax / month" value={usd(m.ebitda)} hint={`${usd(m.ebitda * 12)} / yr · ${eur(m.ebitda)}`} />
        <Stat label="Break-even users" value={breakEven ? breakEven.toLocaleString() : "> 500k"} hint={`${breakEven ? Math.ceil(breakEven / p.upS) : "–"} suppliers`} />
        <Stat label="Fixed costs / month" value={usd(m.fixed)} hint={eur(m.fixed)} />
      </div>
      {perTxFee < perTxProc && <p className="rounded-2xl bg-red-50 p-4 text-[13.5px] text-red-800">⚠ Each booking earns {usd(perTxFee)} in fees but costs ≈{usd(perTxProc)} in card processing — raise the fee, add it on top, or push processing to suppliers.</p>}
      {p.premPrice < 4 && <p className="rounded-2xl bg-amber-50 p-4 text-[13.5px] text-amber-900">Premium at {usd(p.premPrice)}/mo loses ≈{pct1(100 - (m.rows[4].gross - m.rows[4].proc) / Math.max(1, m.rows[4].gross) * 100)} to store/processor fees (Paddle's $0.50 flat fee alone is {pct1(50 / p.premPrice)} of the price). Annual billing or a higher price improves this a lot.</p>}

      <Card title="Profit & loss (monthly)" sub={`${users.toLocaleString()} users · ${Math.round(m.suppliers)} suppliers · ${m.txs.toFixed(0)} bookings`}>
        <table className="w-full text-[13.5px]">
          <thead className="text-left text-[12px] text-ink-faint"><tr><th>Stream</th><th className="text-right">Gross</th><th className="text-right">Fees</th><th className="text-right">Net</th></tr></thead>
          <tbody>
            {m.rows.map((r) => <tr key={r.name} className="border-t border-black/5"><td className="py-2 font-medium">{r.name}<div className="text-[12px] font-normal text-ink-faint">{r.note}</div></td><td className="text-right">{usd(r.gross)}</td><td className="text-right text-red-700">−{usd(r.proc)}</td><td className="text-right font-semibold">{usd(r.gross - r.proc)}</td></tr>)}
            <tr className="border-t border-black/5"><td className="py-2">Refunds & chargebacks ({p.refunds}%)</td><td /><td className="text-right text-red-700">−{usd(m.refunds)}</td><td /></tr>
            <tr className="border-t-2 border-black/10 font-semibold"><td className="py-2">Net revenue</td><td className="text-right">{usd(m.grossTotal)}</td><td className="text-right text-red-700">−{usd(m.procTotal + m.refunds)}</td><td className="text-right">{usd(m.net)}</td></tr>
            <tr className="border-t border-black/5"><td className="py-2">Variable costs (SMS codes, AI, hosting per user)</td><td /><td /><td className="text-right text-red-700">−{usd(m.variable)}</td></tr>
            <tr className="border-t border-black/5"><td className="py-2">Fixed costs</td><td /><td /><td className="text-right text-red-700">−{usd(m.fixed)}</td></tr>
            <tr className="border-t-2 border-black/10 font-semibold"><td className="py-2">Profit before tax</td><td /><td /><td className="text-right">{usd(m.ebitda)}</td></tr>
            <tr className="border-t border-black/5"><td className="py-2">Corporate tax ({p.tax}%)</td><td /><td /><td className="text-right text-red-700">−{usd(m.tax)}</td></tr>
            <tr className="border-t-2 border-black/10 font-semibold"><td className="py-2">Net income</td><td /><td /><td className="text-right">{usd(m.income)} <span className="font-normal text-ink-faint">({eur(m.income)})</span></td></tr>
          </tbody>
        </table>
      </Card>

      <Card title="Scenarios" sub="Same assumptions, different scale (monthly)">
        <div className="overflow-x-auto"><table className="w-full text-[13.5px]"><thead className="text-left text-[12px] text-ink-faint"><tr><th>Users</th><th className="text-right">Net revenue</th><th className="text-right">Costs</th><th className="text-right">Profit before tax</th><th className="text-right">Margin</th></tr></thead>
          <tbody>{scen.map((u) => { const x = model(u, p, proc); return <tr key={u} className="border-t border-black/5"><td className="py-2">{u.toLocaleString()}</td><td className="text-right">{usd(x.net)}</td><td className="text-right">{usd(x.variable + x.fixed)}</td><td className={`text-right font-semibold ${x.ebitda < 0 ? "text-red-700" : ""}`}>{usd(x.ebitda)}</td><td className="text-right">{x.net ? pct1((x.ebitda / x.net) * 100) : "–"}</td></tr>; })}</tbody></table></div>
      </Card>

      <Card title="Demand assumptions" sub={live ? `Live today: ${live.users} customers · ${live.suppliers} suppliers` : ""}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-[12.5px] text-ink-soft">Total users<input type="number" min={1} value={users} onChange={(e) => setUsers(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink outline-none" /></label>
          {set("tx", "Bookings per user / month", 0.05)}{set("cost", "Avg job price ($)")}{set("fee", "Booking fee (%)", 0.5)}{set("upS", "Users per supplier")}
          {set("subPct", "% suppliers on fee-avoidance sub")}{set("subPrice", "Sub price ($/mo)", 0.5)}{set("promoPct", "% suppliers buying promotion")}{set("promoPrice", "Promotion price ($)")}
          {set("listPct", "% suppliers in lead list")}{set("listPrice", "Lead list price ($)")}{set("premPct", "% users on Premium")}{set("premPrice", "Premium price ($/mo)", 0.5)}
        </div>
      </Card>
      <Card title="Payments & store fees" sub="Paddle = merchant of record (handles VAT/sales tax worldwide) for software subscriptions · Stripe Connect for bookings · Apple IAP on iOS">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-[12.5px] text-ink-soft">Booking fee added on top of price?<select value={p.feeOnTop} onChange={(e) => setP({ ...p, feeOnTop: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink"><option value={1}>Yes — customer pays it</option><option value={0}>No — deducted from supplier</option></select></label>
          {sel("sub", "Supplier sub billed via")}{sel("promo", "Promotion billed via")}{sel("list", "Lead list billed via")}
          {set("intlShare", "% cards from outside EEA")}{set("iosShare", "% Premium users on iOS (Apple IAP)")}{set("refunds", "Refunds & chargebacks (% of gross)", 0.5)}{set("eur", "EUR per USD", 0.01)}
        </div>
      </Card>
      <Card title="Costs" sub="Placeholders — replace with real quotes (monthly, USD)">
        <div className="grid gap-3 sm:grid-cols-4">
          {set("infra", "Supabase + Vercel + domain")}{set("tools", "Email, analytics, SMS number")}{set("apple", "Apple Developer ($99/yr ÷ 12)", 0.25)}{set("gestoria", "Accountant / gestoría (Spain)")}
          {set("legal", "Legal (amortized)")}{set("support", "Customer support tools")}{set("marketing", "Marketing & ambassadors")}{set("insurance", "Insurance")}
          {set("smsPerUser", "SMS code cost per sign-up ($)", 0.01)}{set("perActive", "Hosting + AI per user / mo ($)", 0.01)}{set("tax", "Corporate tax (%)")}
        </div>
        <p className="mt-3 text-[12px] text-ink-faint">Spanish corporate tax is 25% generally, with a reduced rate for new companies in their first profitable years — confirm the current rate with your gestor. No salaries are included.</p>
      </Card>
      <Card title="Rollout schedule" sub="Nov: Booth, all free · Dec: all of UChicago, all free · Jan: revenue starts">
        <label className="block text-[13px] text-ink-soft">Premium & fees start on<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 rounded-xl border border-black/10 px-3 py-2 text-[15px] text-ink outline-none" /></label>
        <button className="btn-primary mt-3 !py-2" onClick={saveDate}>Save date</button>
        {msg && <p className="mt-2 text-[13px] text-brand-700">{msg}</p>}
      </Card>
    </div>
  );
}
