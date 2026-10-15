import { CREDIT_FRIEND, CREDIT_SUPPLIER, PROMO_END_LABEL, PROMO_FINE_PRINT, promoActive } from "@/lib/referrals";

export default function ReferralBanner({ stats }: { stats?: { friends: number; suppliers: number; credits: number } }) {
  const active = promoActive();
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-white/80">🎁 Early-member rewards{active ? ` · until ${PROMO_END_LABEL}` : " · ended"}</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Grow your network, earn cashback on premium features.</h3>
          <p className="mt-2 max-w-2xl text-[14px] text-white/85">Every friend who joins through your link earns you <b>{CREDIT_FRIEND} credit</b>. Refer a new supplier and you earn <b>triple — {CREDIT_SUPPLIER} credits</b>. Credits turn into cashback on the premium features coming soon.</p>
        </div>
        {stats && (
          <div className="rounded-xl bg-white/15 px-4 py-3 text-center backdrop-blur">
            <div className="text-3xl font-semibold leading-none">{stats.credits}</div>
            <div className="mt-1 text-[12px] text-white/80">credits · {stats.friends} friend{stats.friends === 1 ? "" : "s"}, {stats.suppliers} supplier{stats.suppliers === 1 ? "" : "s"}</div>
          </div>
        )}
      </div>
      <p className="mt-3 text-[12px] text-white/70">{PROMO_FINE_PRINT}</p>
    </div>
  );
}
