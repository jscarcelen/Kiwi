import { Suspense } from "react";
import SignupForm from "@/components/SignupForm";
import SignupSwitch from "@/components/SignupSwitch";
export default function Signup({ searchParams }: { searchParams: { ref?: string; community?: string } }) {
  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <h1 className="text-center text-4xl font-semibold tracking-tight">Join WOM</h1>
      <p className="mt-2 text-center text-ink-soft">See what the people you trust recommend.</p>
      <SignupSwitch active="user" refId={searchParams.ref} community={searchParams.community} />
      <div className="card mt-8 p-7"><Suspense><SignupForm /></Suspense></div>
    </div>
  );
}
