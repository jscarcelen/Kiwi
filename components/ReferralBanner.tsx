import { CREDIT_COMMUNITY, CREDIT_FRIEND, CREDIT_SUPPLIER, CREDITS_PER_MONTH, PROMO_END_LABEL, PROMO_FINE_PRINT, promoActive } from "@/lib/referrals";

export default function ReferralBanner({ stats }: { stats?: { friends: number; suppliers: number; members: number; credits: number } }) {
  const active = promoActive();
  const months = stats ? Math.floor(stats.credits / CREDITS_PER_MONTH) : 0;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-white/80">🎁 Early-member rewards{active ? ` · friend & supplier bonus until ${PROMO_END_LABEL}` : ""}</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Grow your network, earn free Premium months.</h3>
          <p className="mt-2 max-w-2xl text-[14px] text-white/85">Each friend who joins through your link earns <b>{CREDIT_FRIEND} credit</b>, each person who joins one of your communities earns <b>{CREDIT_COMMUNITY}</b>, and each new supplier you refer earns <b>triple — {CREDIT_SUPPLIER} credits</b>. Every {CREDITS_PER_MONTH} credits = <b>1 free month of Premium</b>, plus cashback on the premium features coming soon.</p>
        </div>
        {stats && (
          <div className="rounded-xl bg-white/15 px-4 py-3 text-center backdrop-blur">
            <div className="text-3xl font-semibold leading-none">{stats.credits}</div>
            <div className="mt-1 text-[12px] text-white/80">credits · {months} free month{months === 1 ? "" : "s"} banked</div>
            <div className="text-[11px] text-white/60">{stats.friends} friends · {stats.members} members · {stats.suppliers} suppliers</div>
          </div>
        )}
      </div>
      <p className="mt-3 text-[12px] text-white/70">{PROMO_FINE_PRINT}</p>
    </div>
  );
}
