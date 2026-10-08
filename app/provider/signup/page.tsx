import ProviderSignupForm from "@/components/ProviderSignupForm";
export default function ProviderSignup() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="text-center text-4xl font-semibold tracking-tight">List your business on Kiwi</h1>
      <p className="mt-2 text-center text-ink-soft">Takes about a minute. Customers find you through friends who already trust you.</p>
      <div className="card mt-8 p-7"><ProviderSignupForm /></div>
    </div>
  );
}
