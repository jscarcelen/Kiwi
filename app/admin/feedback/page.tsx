import type { Metadata } from "next";
import FeedbackBoard from "@/components/FeedbackBoard";

export const metadata: Metadata = { title: "Kiwi feedback", robots: { index: false, follow: false } };

// Open on purpose: shared by link with the team only (no login). Don't publish this URL.
export default function FeedbackAdmin() {
  return <FeedbackBoard />;
}
