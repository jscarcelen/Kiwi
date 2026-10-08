import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import FeedbackWidget from "@/components/FeedbackWidget";

export const metadata: Metadata = {
  title: "Kiwi — find services your friends already trust",
  description: "A trusted-services marketplace powered by recommendations from people you know.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Nav />
        <main>{children}</main>
        <footer className="mt-24 border-t border-black/5 py-10 text-center text-[13px] text-ink-faint">
          🥝 Kiwi · Trusted services, recommended by people you know · Chicago · Beta
        </footer>
        <FeedbackWidget />
      </body>
    </html>
  );
}
