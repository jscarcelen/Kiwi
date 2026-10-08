export const CATEGORIES = [
  { slug: "cleaning", label: "Cleaning", emoji: "✨", blurb: "Homes, apartments, move-out deep cleans" },
  { slug: "moving", label: "Moving & Handyman", emoji: "📦", blurb: "Movers, assembly, repairs" },
  { slug: "dog-walking", label: "Dog walking", emoji: "🐕", blurb: "Walks, sitting, drop-ins" },
  { slug: "child-care", label: "Child care", emoji: "🧸", blurb: "Nannies, babysitters, after-school" },
] as const;
export const CITIES = ["Chicago", "Evanston", "Oak Park"];
export const catLabel = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
export const catEmoji = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.emoji ?? "•";
