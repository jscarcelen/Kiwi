import { CATEGORIES } from "./categories";

export type Opt = { value: string; label: string };
export type Q = { id: string; title: string; type: "single" | "multi"; options: Opt[] };

const SIZE: Opt[] = [{ value: "studio", label: "Studio" }, { value: "1-2br", label: "1–2 bedrooms" }, { value: "3br+", label: "3+ bedrooms" }];
const PROPERTY: Opt[] = [{ value: "apartment", label: "Apartment / condo" }, { value: "house", label: "House" }, { value: "townhouse", label: "Townhouse" }];

export const QUESTIONS: Record<string, Q[]> = {
  cleaning: [
    { id: "clean_type", title: "What kind of cleaning do you need?", type: "multi", options: [{ value: "regular", label: "Regular cleaning" }, { value: "deep", label: "Deep clean" }, { value: "move", label: "Move-in / move-out" }] },
    { id: "home_size", title: "How big is your place?", type: "single", options: SIZE },
    { id: "property", title: "What type of property?", type: "single", options: PROPERTY },
    { id: "frequency", title: "How often?", type: "single", options: [{ value: "once", label: "One time" }, { value: "recurring", label: "Weekly or every other week" }] },
  ],
  moving: [
    { id: "job", title: "What do you need help with?", type: "multi", options: [{ value: "move", label: "Moving" }, { value: "packing", label: "Packing" }, { value: "assembly", label: "Furniture assembly" }, { value: "repairs", label: "Mounting & small repairs" }] },
    { id: "home_size", title: "How big is the place?", type: "single", options: SIZE },
    { id: "property", title: "What type of property?", type: "single", options: PROPERTY },
  ],
  "dog-walking": [
    { id: "dog_service", title: "What do you need?", type: "multi", options: [{ value: "walks", label: "Dog walks" }, { value: "dropin", label: "Drop-in visits" }, { value: "sitting", label: "Sitting / boarding" }] },
    { id: "dogs", title: "How many dogs?", type: "single", options: [{ value: "1", label: "1 dog" }, { value: "2", label: "2 dogs" }, { value: "3+", label: "3 or more" }] },
    { id: "frequency", title: "How often?", type: "single", options: [{ value: "once", label: "Just once" }, { value: "recurring", label: "Regularly" }] },
  ],
  "child-care": [
    { id: "care_type", title: "What kind of care?", type: "multi", options: [{ value: "babysitter", label: "Babysitter (evenings / weekends)" }, { value: "nanny", label: "Nanny (regular schedule)" }, { value: "afterschool", label: "After-school pickup & help" }] },
    { id: "kids", title: "How many children?", type: "single", options: [{ value: "1", label: "1 child" }, { value: "2", label: "2 children" }, { value: "3+", label: "3 or more" }] },
    { id: "ages", title: "How old are they?", type: "multi", options: [{ value: "infant", label: "Infant (0–1)" }, { value: "toddler", label: "Toddler (1–3)" }, { value: "preschool", label: "Preschool (3–5)" }, { value: "school", label: "School-age (6+)" }] },
  ],
};

QUESTIONS.tutoring = [
  { id: "subject", title: "What do you need help with?", type: "multi", options: [
    { value: "school", label: "School subjects (math, science, writing)" }, { value: "test", label: "Test prep (GMAT, GRE, SAT, LSAT…)" },
    { value: "recruiting", label: "Recruiting (resume, networking, interviews)" }, { value: "case", label: "Case interviews (consulting)" },
    { value: "bschool", label: "Business school classes (finance, accounting, stats)" }, { value: "languages", label: "Languages" }, { value: "coding", label: "Coding & data" }] },
  { id: "level", title: "What level?", type: "single", options: [{ value: "hs", label: "High school" }, { value: "undergrad", label: "Undergraduate" }, { value: "grad", label: "MBA / graduate" }, { value: "pro", label: "Working professional" }] },
  { id: "format", title: "How would you like to meet?", type: "single", options: [{ value: "inperson", label: "In person" }, { value: "online", label: "Online" }] },
  { id: "frequency", title: "How often?", type: "single", options: [{ value: "once", label: "One-time session" }, { value: "recurring", label: "Ongoing (weekly)" }] },
];
QUESTIONS.beauty = [
  { id: "beauty_service", title: "What are you looking for?", type: "multi", options: [
    { value: "haircut", label: "Haircut & styling" }, { value: "color", label: "Hair color" }, { value: "barber", label: "Barber" }, { value: "makeup", label: "Makeup" },
    { value: "nails", label: "Nails" }, { value: "brows", label: "Brows & lashes" }, { value: "skin", label: "Facials & skin care" }] },
  { id: "client", title: "Who is it for?", type: "single", options: [{ value: "women", label: "Women" }, { value: "men", label: "Men" }, { value: "kids", label: "Kids" }] },
  { id: "beauty_place", title: "Where?", type: "single", options: [{ value: "salon", label: "At a salon / studio" }, { value: "mobile", label: "They come to me" }] },
];

export const WHEN: Q = {
  id: "when", title: "What's your timeline?", type: "single",
  options: [{ value: "urgent", label: "Urgent — within 48 hours" }, { value: "week", label: "Ready to hire, within a week" }, { value: "flex", label: "Still researching" }],
};
export const WHEN_LABEL: Record<string, string> = { urgent: "Within 48 hours", week: "Within a week", flex: "Flexible" };

export const labelFor = (cat: string, qid: string, value: string) =>
  QUESTIONS[cat]?.find((q) => q.id === qid)?.options.find((o) => o.value === value)?.label ?? value;

export type Answers = Record<string, string[]>;

export function readAnswers(sp: Record<string, string | undefined>, cat: string): Answers {
  const out: Answers = {};
  for (const q of QUESTIONS[cat] ?? []) {
    const raw = sp[`a_${q.id}`];
    if (raw) out[q.id] = raw.split(",").filter((v) => q.options.some((o) => o.value === v));
    if (out[q.id]?.length === 0) delete out[q.id];
  }
  return out;
}
export function answersToParams(a: Answers) {
  const p: Record<string, string> = {};
  for (const [k, v] of Object.entries(a)) if (v.length) p[`a_${k}`] = v.join(",");
  return p;
}

const RULES: [string, RegExp][] = [
  ["dog-walking", /\b(dog|dogs|puppy|pup|leash|pet sit|dog walk)/i],
  ["child-care", /\b(child|children|kid|kids|nanny|babysit|toddler|baby|infant|after.?school|daycare)/i],
  ["beauty", /\b(hair|haircut|salon|barber|makeup|make-up|nails?|manicure|pedicure|brows?|lashes|facial|stylist|balayage|blowout|beauty|highlights)/i],
  ["tutoring", /\b(tutor|tutoring|gmat|gre|sat|lsat|mcat|exam|homework|case interview|interview prep|recruit|resume|study|studying|calculus|accounting|finance class|stats|essay|coach)/i],
  ["cleaning", /\b(clean|maid|mop|dust|housekeep|deep clean|tidy|scrub)/i],
  ["moving", /\b(mov(e|ing|ers?)|furniture|assembl|handyman|mount|ikea|shelf|drill|repair|fix|install|paint|haul|pack)/i],
];
export function classifyFallback(text: string): string | null {
  for (const [slug, re] of RULES) if (re.test(text)) return slug;
  return null;
}
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as string[];

export const HEADINGS: Record<string, string> = {
  clean_type: "Type of cleaning", home_size: "Home size", property: "Property type", frequency: "Frequency",
  job: "Services", dog_service: "Services", dogs: "Number of dogs", care_type: "Type of care", kids: "Number of children", ages: "Ages", subject: "Subjects", level: "Level", format: "Format", beauty_service: "Services", client: "Who it's for", beauty_place: "Where",
};
