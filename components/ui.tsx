import Link from "next/link";
import { initials, type RankedProvider } from "@/lib/data";
import { catEmoji, catLabel } from "@/lib/categories";

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" className={value >= i - 0.25 ? "text-amber-400" : value >= i - 0.75 ? "text-amber-300" : "text-black/15"} fill="currentColor">
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L10 14.9l-5.3 2.8 1.1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

const hues = ["bg-kiwi-100 text-kiwi-700", "bg-sky-100 text-sky-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-violet-100 text-violet-700"];
export function Avatar({ name, id = "", size = 32 }: { name: string; id?: string; size?: number }) {
  const h = hues[(id.charCodeAt(id.length - 1) || name.length) % hues.length];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white ${h}`} style={{ width: size, height: size, fontSize: size * 0.38 }} title={name}>
      {initials(name)}
    </span>
  );
}

export function ProviderCard({ r, signedIn }: { r: RankedProvider; signedIn: boolean }) {
  const p = r.provider;
  return (
    <Link href={`/providers/${p.id}`} className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-kiwi-50 to-kiwi-100">
        {p.photo_url ? <img src={p.photo_url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="text-5xl">{catEmoji(p.category)}</span>}
        {r.net && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-medium text-kiwi-700 backdrop-blur">In your network</span>}
      </div>
      <div className="p-5">
        <div className="text-[12px] font-medium uppercase tracking-wide text-ink-faint">{catLabel(p.category)} · {p.city}</div>
        <h3 className="mt-1 text-[19px] font-semibold tracking-tight">{p.company}</h3>
        {r.net ? (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <Stars value={r.net.score} /> <span className="text-[15px] font-semibold">{r.net.score.toFixed(1)}</span>
              <span className="text-[13px] text-ink-soft">from your circle</span>
            </div>
            <div className="mt-2 flex items-center">
              <div className="flex -space-x-2">{r.net.endorsers.slice(0, 4).map((e) => <Avatar key={e.id} id={e.id} name={e.name} size={26} />)}</div>
              <span className="ml-2 text-[13px] text-ink-soft">{r.net.count} {r.net.count === 1 ? "contact has" : "contacts have"} used</span>
            </div>
          </div>
        ) : null}
        <div className={`flex items-center gap-2 ${r.net ? "mt-3 border-t border-black/5 pt-3" : "mt-3"}`}>
          {r.avg ? <><Stars value={r.avg} size={14} /><span className="text-[13px] text-ink-soft">{r.avg.toFixed(1)} · {r.n} ratings overall</span></> : <span className="text-[13px] text-ink-faint">No ratings yet</span>}
        </div>
      </div>
    </Link>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card mx-auto max-w-xl p-10 text-center">
      <div className="text-4xl">🥝</div>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <div className="mt-2 text-ink-soft">{children}</div>
    </div>
  );
}
