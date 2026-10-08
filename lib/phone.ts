// Normalise to digits with country code. 10-digit numbers are assumed to be US (+1).
export function toDigits(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (!raw.trim().startsWith("+") && d.length === 10) d = "1" + d;
  if (!raw.trim().startsWith("+") && d.length === 11 && d.startsWith("1")) return d;
  return d;
}
export const toE164 = (raw: string) => "+" + toDigits(raw);
export const validPhone = (raw: string) => { const d = toDigits(raw); return d.length >= 10 && d.length <= 15; };

export type Contact = { name: string; num: string };
export function parseContacts(text: string): Contact[] {
  const out: Contact[] = [];
  if (/BEGIN:VCARD/i.test(text)) {
    for (const card of text.split(/BEGIN:VCARD/i).slice(1)) {
      const name = /^FN[^:]*:(.+)$/im.exec(card)?.[1]?.trim() ?? "";
      for (const m of card.matchAll(/^TEL[^:]*:(.+)$/gim)) { const n = toDigits(m[1].trim()); if (n.length >= 10) out.push({ name, num: n }); }
    }
  } else {
    for (const line of text.split(/\r?\n/)) {
      const phones = line.match(/\+?\d[\d\s().-]{8,}\d/g) ?? [];
      const name = line.replace(/\+?\d[\d\s().-]{8,}\d/g, "").replace(/[",;]+/g, " ").trim();
      for (const p of phones) { const n = toDigits(p); if (n.length >= 10) out.push({ name, num: n }); }
    }
  }
  const seen = new Set<string>();
  return out.filter((c) => (seen.has(c.num) ? false : (seen.add(c.num), true)));
}
