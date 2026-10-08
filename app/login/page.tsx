import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
export default function Login() {
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-center text-4xl font-semibold tracking-tight">Welcome back</h1>
      <div className="card mt-8 p-7"><Suspense><LoginForm /></Suspense></div>
    </div>
  );
}
