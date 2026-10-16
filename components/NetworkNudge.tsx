import Link from "next/link";

// Signed-in home strip: puts the network front and centre, because ratings from people you know are the product.
export default function NetworkNudge({ friends, groups }: { friends: number; groups: number }) {
  const empty = friends === 0 && groups === 0;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-5">
      <Link href="/network" className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 p-5 text-white shadow-pop transition hover:brightness-110 sm:p-6">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-3xl">👥</span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold tracking-tight sm:text-xl">{empty ? "Build your network to unlock trusted ratings" : `Your network: ${friends} friend${friends === 1 ? "" : "s"} · ${groups} communit${groups === 1 ? "y" : "ies"}`}</span>
          <span className="mt-0.5 block text-[14px] text-white/80">{empty ? "Add friends or join your university community — it takes a minute." : "The more people you add, the better your recommendations get."}</span>
        </span>
        <span className="hidden shrink-0 rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-brand-700 sm:block">{empty ? "Get started" : "Grow it"} →</span>
      </Link>
    </section>
  );
}
