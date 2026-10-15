import Link from "next/link";

/** "I'm looking for pros" vs "I offer a service": the first choice when joining. Keeps the inviter (`ref`) and community across the switch. */
export default function SignupSwitch({ active, refId, community }: { active: "user" | "supplier"; refId?: string; community?: string }) {
  const q = (params: Record<string, string | undefined>) => {
    const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return s ? `?${s}` : "";
  };
  const items = [
    { id: "user", icon: "🙋", title: "I'm looking for pros", sub: "Find trusted services", href: `/signup${q({ ref: refId, community })}` },
    { id: "supplier", icon: "🛠️", title: "I am a pro", sub: "List my business", href: `/provider/signup${q({ ref: refId })}` },
  ] as const;
  return (
    <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-1 rounded-3xl bg-black/5 p-1" role="tablist" aria-label="Sign up as">
      {items.map((i) => (
        <Link key={i.id} href={i.href} role="tab" aria-selected={active === i.id} replace
          className={`rounded-[1.25rem] px-3 py-3 text-center transition ${active === i.id ? "bg-white shadow-sm ring-1 ring-black/5" : "text-ink-soft hover:bg-black/5"}`}>
          <div className="text-xl" aria-hidden>{i.icon}</div>
          <div className="mt-0.5 text-[14px] font-semibold leading-tight text-ink">{i.title}</div>
          <div className="text-[12px] leading-tight">{i.sub}</div>
        </Link>
      ))}
    </div>
  );
}
