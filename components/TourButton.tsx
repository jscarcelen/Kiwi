"use client";
export default function TourButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent("wom:tour"))}>{children}</button>;
}
