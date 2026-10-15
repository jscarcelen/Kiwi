import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import Nav from "@/components/Nav";
import FeedbackWidget from "@/components/FeedbackWidget";

export const metadata: Metadata = {
  title: "Kiwi — find services your friends already trust",
  description: "A trusted-services marketplace powered by recommendations from people you know.",
  appleWebApp: { capable: true, title: "Kiwi", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#6aa84f", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Nav />
        <main>{children}</main>
        <footer className="mt-24 border-t border-black/5 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 text-[14px] sm:grid-cols-2 lg:grid-cols-4">
            <div><div className="flex items-center gap-2 text-xl font-semibold text-forest"><span>🥝</span> kiwi</div><p className="mt-2 text-ink-soft">Trusted services,<br />recommended by people you know.</p></div>
            <div><h4 className="font-semibold">Customers</h4><ul className="mt-3 space-y-2 text-ink-soft"><li><Link href="/search">Browse pros</Link></li><li><Link href="/signup">Sign up</Link></li><li><Link href="/network">My network</Link></li><li><Link href="/help">Phone sign-in &amp; contacts</Link></li></ul></div>
            <div><h4 className="font-semibold">Pros</h4><ul className="mt-3 space-y-2 text-ink-soft"><li><Link href="/provider/signup">Join as a pro</Link></li><li><Link href="/provider/dashboard">Pro dashboard</Link></li></ul></div>
            <div><h4 className="font-semibold">Support</h4><ul className="mt-3 space-y-2 text-ink-soft"><li><Link href="/help">Help</Link></li><li><Link href="/privacy">Privacy</Link></li><li>Chicago · Beta</li></ul></div>
          </div>
        </footer>
        <FeedbackWidget />
      </body>
    </html>
  );
}
