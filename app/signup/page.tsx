import { Suspense } from "react";
import SignupForm from "@/components/SignupForm";
export default function Signup() {
  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <h1 className="text-center text-4xl font-semibold tracking-tight">Join Kiwi</h1>
      <p className="mt-2 text-center text-ink-soft">See what the people you trust recommend.</p>
      <div className="card mt-8 p-7"><Suspense><SignupForm /></Suspense></div>
    </div>
  );
}
