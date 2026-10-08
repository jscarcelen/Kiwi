import Link from "next/link";

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kiwi-100 text-[13px] font-semibold text-kiwi-700">{n}</span><span className="pt-0.5 text-ink-soft">{children}</span></li>
);

export const metadata = { title: "Help — Kiwi" };

export default function Help() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">How Kiwi works with your phone</h1>
      <p className="mt-2 text-ink-soft">Sign in with a text code, then find friends who are already here.</p>

      <h2 className="mt-10 text-2xl font-semibold tracking-tight">📱 Sign in with your phone</h2>
      <ol className="card mt-4 space-y-4 p-6">
        <Step n={1}>Go to <Link className="text-kiwi-700 underline" href="/signup">Join</Link> (new) or <Link className="text-kiwi-700 underline" href="/login">Sign in</Link> and tap <b>Continue with phone</b>.</Step>
        <Step n={2}>Enter your name (new accounts) and mobile number. US numbers need no country code; elsewhere start with + and your country code.</Step>
        <Step n={3}>Tap <b>Text me a code</b>. A 6-digit code arrives by SMS within a few seconds.</Step>
        <Step n={4}>Type the code and tap <b>Verify & continue</b>. No password needed — next time, repeat with a new code.</Step>
      </ol>
      <p className="mt-3 text-[14px] text-ink-faint">Signed up with email? Open <Link className="underline" href="/network">My network</Link> and verify your phone there so friends can find you.</p>

      <h2 className="mt-10 text-2xl font-semibold tracking-tight">👥 Find friends from your contacts</h2>
      <p className="mt-2 text-ink-soft">Kiwi checks which of your contacts' numbers belong to Kiwi members and lets you connect with one tap. The list is matched on the spot and never stored. Only people who allow it can be found.</p>

      <div className="mt-4 space-y-4">
        <div className="card p-6">
          <h3 className="font-semibold">iPhone (website or home-screen app)</h3>
          <p className="mt-1 text-[14px] text-ink-soft">Safari doesn't let websites read your contacts, so export them once from a computer:</p>
          <ol className="mt-3 space-y-3">
            <Step n={1}>On a computer, open <b>icloud.com</b> → <b>Contacts</b>. Click any contact, then press <b>Cmd+A</b> (Ctrl+A on Windows).</Step>
            <Step n={2}>Click the ⚙️ at the bottom left → <b>Export vCard</b>. A .vcf file downloads.</Step>
            <Step n={3}>On that same computer, open Kiwi → <Link className="text-kiwi-700 underline" href="/network">My network</Link> → <b>Upload contacts file</b> and choose the file.</Step>
            <Step n={4}>Tap <b>Add</b> next to each friend, or <b>Add all</b>.</Step>
          </ol>
          <p className="mt-3 text-[13px] text-ink-faint">Prefer to skip the export? Paste a few numbers (one per line) into the box under the upload button. A one-tap import is coming with the Kiwi iPhone app.</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">Android (Chrome)</h3>
          <ol className="mt-3 space-y-3">
            <Step n={1}>Open <Link className="text-kiwi-700 underline" href="/network">My network</Link> and tap <b>Choose from my contacts</b>.</Step>
            <Step n={2}>Select the people you want to check (or all) and confirm.</Step>
            <Step n={3}>Add the ones already on Kiwi; invite the rest by text.</Step>
          </ol>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">Google Contacts or Outlook (any device)</h3>
          <p className="mt-1 text-[14px] text-ink-soft">Export your contacts as a CSV file from contacts.google.com (Export → Google CSV) and use <b>Upload contacts file</b> on My network.</p>
        </div>
      </div>

      <h2 className="mt-10 text-2xl font-semibold tracking-tight">Not on Kiwi yet?</h2>
      <p className="mt-2 text-ink-soft">After matching, you'll see an <b>Invite by text</b> link next to each contact not on Kiwi. Friends who join through your link are connected to you automatically.</p>
      <p className="mt-8 text-[14px] text-ink-faint">Questions? Use the 💬 Feedback button on any page.</p>
    </div>
  );
}
