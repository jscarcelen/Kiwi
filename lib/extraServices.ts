/** More services chosen at sign-up (e.g. Cleaning + Dog walking): saved as extra listings of the same account. */
export type ExtraService = { category: string; name: string; attributes: Record<string, string[]> };

/** Inserts the extra listings (copying the first listing's contact details, regions and description). Skips categories already listed. */
export async function insertExtraServices(s: any, userId: string, extras: ExtraService[]) {
  if (!extras.length) return;
  const { data: mine } = await s.from("providers").select("*").eq("owner_id", userId).order("created_at");
  const first = (mine ?? [])[0];
  if (!first) return;
  const have = new Set((mine ?? []).map((m: any) => m.category));
  const rows = extras.filter((x) => x.category && !have.has(x.category)).map((x) => ({
    owner_id: userId, company: x.name?.trim() || first.company, contact_name: first.contact_name, category: x.category, city: first.city, regions: first.regions,
    description: first.description, phone: first.phone, email: first.email, photo_url: first.photo_url, attributes: x.attributes ?? {},
  }));
  if (rows.length) await s.from("providers").insert(rows);
}
