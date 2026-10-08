export const metadata = { title: "Privacy — Kiwi" };
export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 leading-relaxed text-ink-soft">
      <h1 className="text-4xl font-semibold tracking-tight text-ink">Privacy</h1>
      <p className="mt-2 text-[13px] text-ink-faint">Draft for the beta. Last updated October 2026.</p>
      <h2 className="mt-8 text-xl font-semibold text-ink">What we collect</h2>
      <p className="mt-2">Account details you give us (name, email and/or phone number, optional Instagram handle), the reviews and feedback you submit, the connections and groups you join, and basic usage events such as which providers you view (shown to providers only as aggregate counts).</p>
      <h2 className="mt-8 text-xl font-semibold text-ink">Contacts</h2>
      <p className="mt-2">If you choose to find friends from your contacts, phone numbers are sent to Kiwi only to check which belong to Kiwi members who allow discovery. We do not store your contact list. You can turn off discoverability anytime on My network.</p>
      <h2 className="mt-8 text-xl font-semibold text-ink">Who sees your reviews</h2>
      <p className="mt-2">If you choose "Share with my friends & groups", your name and review are visible to your connections and to groups where you allow it. Otherwise only your star rating counts, anonymously, toward the overall score.</p>
      <h2 className="mt-8 text-xl font-semibold text-ink">Your choices</h2>
      <p className="mt-2">You can delete your account and data at any time from My network → Delete my account. Data is stored with Supabase and the site is hosted on Vercel.</p>
      <h2 className="mt-8 text-xl font-semibold text-ink">Contact</h2>
      <p className="mt-2">jsanzcar@chicagobooth.edu</p>
    </div>
  );
}
