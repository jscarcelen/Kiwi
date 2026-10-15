import { CREDIT_COMMUNITY, CREDIT_FRIEND, CREDIT_SUPPLIER, CREDITS_PER_MONTH, PROMO_END_LABEL, PROMO_FINE_PRINT } from "@/lib/referrals";

export default function CreditsCard({ stats }: { stats: { friends: number; suppliers: number; members: number; credits: number } }) {
  const months = Math.floor(stats.credits / CREDITS_PER_MONTH);
  const into = stats.credits % CREDITS_PER_MONTH;
  return (
    <section className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-white/80">🎁 Credits earned toward Premium</p>
          <div className="mt-1 flex items-end gap-3"><span className="text-6xl font-semibold leading-none tracking-tight">{stats.credits}</span><span className="pb-1 text-white/80">credits · {months} free month{months === 1 ? "" : "s"} banked</span></div>
          <div className="mt-4 max-w-sm">
            <div className="h-2 overflow-hidden rounded-full bg-white/25"><div className="h-2 rounded-full bg-white" style={{ width: `${(into / CREDITS_PER_MONTH) * 100}%` }} /></div>
            <p className="mt-1.5 text-[12px] text-white/80">{CREDITS_PER_MONTH - into} more credit{CREDITS_PER_MONTH - into === 1 ? "" : "s"} to your next free month of Premium</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-[12px]">
          {[["Friends", stats.friends, `+${CREDIT_FRIEND} each`], ["Community members", stats.members, `+${CREDIT_COMMUNITY} each`], ["Suppliers", stats.suppliers, `+${CREDIT_SUPPLIER} each`]].map(([l, n, e]) => (
            <div key={l as string} className="rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur"><div className="text-2xl font-semibold">{n}</div><div className="text-white/85">{l}</div><div className="text-white/60">{e}</div></div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[12px] text-white/70">Friend & supplier bonus until {PROMO_END_LABEL}. {PROMO_FINE_PRINT}</p>
    </section>
  );
}
