import { CITIES } from "./categories";

export type Endorser = { id: string; name: string };
export type RankedProvider = {
  provider: any;
  avg: number | null;
  n: number;
  net: { score: number; count: number; endorsers: Endorser[] } | null;
};

export async function getViewer(supabase: any) {
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile };
}

export async function getCircle(supabase: any, userId: string) {
  const [{ data: conns }, { data: memberships }] = await Promise.all([
    supabase.from("connections").select("friend_id").eq("user_id", userId),
    supabase.from("group_members").select("group_id, visible, groups(id, slug, name, email_domain)").eq("user_id", userId),
  ]);
  return {
    friendIds: new Set<string>((conns ?? []).map((c: any) => c.friend_id)),
    groups: (memberships ?? []).map((m: any) => ({ ...m.groups, visible: m.visible })),
  };
}

export async function rankProviders(
  supabase: any,
  userId: string | null,
  f: { service?: string; city?: string; circle?: string; limit?: number }
): Promise<RankedProvider[]> {
  let q = supabase.from("providers").select("*");
  if (f.service && f.service !== "all") q = q.eq("category", f.service);
  if (f.city && CITIES.includes(f.city)) q = q.or(`city.eq.${f.city},regions.cs.{${f.city}}`);
  const { data: providers } = await q;
  if (!providers?.length) return [];
  const ids = providers.map((p: any) => p.id);
  const { data: stats } = await supabase.from("provider_stats").select("*").in("provider_id", ids);
  const statMap = new Map<string, any>((stats ?? []).map((s: any) => [s.provider_id, s]));

  const netMap = new Map<string, { w: number; ws: number; ppl: Map<string, string> }>();
  if (userId) {
    const { friendIds, groups } = await getCircle(supabase, userId);
    let allowed: Set<string> | null = null; // restrict to a custom circle
    if (f.circle === "friends") allowed = friendIds;
    else if (f.circle && f.circle !== "all") {
      const g = groups.find((x: any) => x.slug === f.circle);
      if (g) {
        const { data: mem } = await supabase.from("group_members").select("user_id").eq("group_id", g.id).eq("visible", true);
        allowed = new Set((mem ?? []).map((m: any) => m.user_id));
      } else allowed = new Set();
    }
    const { data: revs } = await supabase
      .from("reviews")
      .select("provider_id,user_id,rating,profiles(full_name)")
      .in("provider_id", ids)
      .neq("user_id", userId);
    for (const r of revs ?? []) {
      if (allowed && !allowed.has(r.user_id)) continue;
      const w = friendIds.has(r.user_id) ? 1 : 0.6;
      const e = netMap.get(r.provider_id) ?? { w: 0, ws: 0, ppl: new Map() };
      e.w += w; e.ws += w * r.rating; e.ppl.set(r.user_id, (r.profiles as any)?.full_name ?? "Friend");
      netMap.set(r.provider_id, e);
    }
  }

  const rows: RankedProvider[] = providers.map((p: any) => {
    const s = statMap.get(p.id);
    const e = netMap.get(p.id);
    return {
      provider: p,
      avg: s ? Number(s.avg_rating) : null,
      n: s?.n ?? 0,
      net: e ? { score: e.ws / e.w, count: e.ppl.size, endorsers: [...e.ppl].map(([id, name]) => ({ id, name })) } : null,
    };
  });
  rows.sort((a, b) => {
    if (!!a.net !== !!b.net) return a.net ? -1 : 1;
    if (a.net && b.net) return b.net.score * Math.log2(b.net.count + 1) - a.net.score * Math.log2(a.net.count + 1);
    return (b.avg ?? 0) * Math.log2(b.n + 1) - (a.avg ?? 0) * Math.log2(a.n + 1);
  });
  return f.limit ? rows.slice(0, f.limit) : rows;
}

export function initials(name: string) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}
