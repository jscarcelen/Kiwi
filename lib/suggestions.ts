import type { Answers } from "./intake";

export type Sug = { label: string; category: string; answers?: Answers; kw?: string };

export const SUGGESTIONS: Sug[] = [
  { label: "Regular home cleaning", category: "cleaning", answers: { clean_type: ["regular"] }, kw: "house apartment maid weekly" },
  { label: "Deep cleaning", category: "cleaning", answers: { clean_type: ["deep"] }, kw: "spring scrub thorough" },
  { label: "Move-out / move-in cleaning", category: "cleaning", answers: { clean_type: ["move"] }, kw: "moveout movein deposit end of lease" },
  { label: "Apartment cleaning", category: "cleaning", answers: { property: ["apartment"] }, kw: "condo studio" },
  { label: "Recurring cleaning service", category: "cleaning", answers: { frequency: ["recurring"] }, kw: "weekly biweekly every other week" },
  { label: "House cleaning", category: "cleaning", answers: { property: ["house"] }, kw: "maid housekeeper" },
  { label: "Local moving help", category: "moving", answers: { job: ["move"] }, kw: "movers truck relocate" },
  { label: "Packing & unpacking", category: "moving", answers: { job: ["packing"] }, kw: "boxes" },
  { label: "Furniture assembly", category: "moving", answers: { job: ["assembly"] }, kw: "ikea wardrobe bed desk build" },
  { label: "TV mounting", category: "moving", answers: { job: ["repairs"] }, kw: "wall mount television" },
  { label: "Handyman & small repairs", category: "moving", answers: { job: ["repairs"] }, kw: "fix install shelf drill paint hang" },
  { label: "Studio / 1-bedroom move", category: "moving", answers: { job: ["move"], home_size: ["studio", "1-2br"] }, kw: "small apartment" },
  { label: "Dog walking", category: "dog-walking", answers: { dog_service: ["walks"] }, kw: "walker leash puppy" },
  { label: "Dog sitting & boarding", category: "dog-walking", answers: { dog_service: ["sitting"] }, kw: "overnight vacation pet sitter" },
  { label: "Drop-in pet visits", category: "dog-walking", answers: { dog_service: ["dropin"] }, kw: "feeding checkin" },
  { label: "Daily midday dog walks", category: "dog-walking", answers: { dog_service: ["walks"], frequency: ["recurring"] }, kw: "weekday work" },
  { label: "Babysitter (evenings & weekends)", category: "child-care", answers: { care_type: ["babysitter"] }, kw: "date night sitter" },
  { label: "Nanny (regular schedule)", category: "child-care", answers: { care_type: ["nanny"] }, kw: "full time part time" },
  { label: "After-school care & pickup", category: "child-care", answers: { care_type: ["afterschool"] }, kw: "homework school" },
  { label: "Infant / newborn care", category: "child-care", answers: { ages: ["infant"] }, kw: "baby newborn" },
  { label: "Toddler care", category: "child-care", answers: { ages: ["toddler"] }, kw: "child kids" },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

export function suggest(text: string, limit = 6): Sug[] {
  const tokens = norm(text).split(/\s+/).filter((t) => t.length >= 2);
  if (!tokens.length) return [];
  return SUGGESTIONS.map((s) => {
    const hay = norm(`${s.label} ${s.kw ?? ""} ${s.category}`);
    const words = hay.split(/\s+/);
    let score = 0;
    for (const t of tokens) {
      if (words.some((w) => w.startsWith(t))) score += 2;
      else if (hay.includes(t)) score += 1;
    }
    return { s, score, all: tokens.every((t) => hay.includes(t)) };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => Number(b.all) - Number(a.all) || b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}
