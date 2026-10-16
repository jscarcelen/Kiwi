import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms — WOM" };

export default function Terms() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14 text-[15px] leading-relaxed text-ink-soft">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Terms of use</h1>
      <p className="mt-3">By using WOM you agree to these terms. They exist to keep recommendations honest and the community safe.</p>
      <h2 className="mt-8 text-xl font-semibold text-ink">No objectionable content</h2>
      <p className="mt-2">There is zero tolerance for abusive, harassing, hateful, sexually explicit, fraudulent or misleading content, and for fake or paid-for reviews. Reviews must reflect your own experience with a service.</p>
      <h2 className="mt-8 text-xl font-semibold text-ink">Reporting and blocking</h2>
      <p className="mt-2">Every review, profile and member has a Report option, and you can block anyone from your network or settings. We review reports within 24 hours, remove content that breaks these rules, and suspend or remove the accounts responsible.</p>
      <h2 className="mt-8 text-xl font-semibold text-ink">Your account</h2>
      <p className="mt-2">You're responsible for activity on your account. You can delete your account at any time in Settings. WOM connects you with independent professionals and isn't a party to the services they provide.</p>
      <h2 className="mt-8 text-xl font-semibold text-ink">Contact</h2>
      <p className="mt-2">Questions or urgent reports: use the Feedback button in the app.</p>
    </div>
  );
}
