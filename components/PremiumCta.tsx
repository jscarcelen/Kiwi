"use client";
import { useState } from "react";
import UpgradeModal from "./UpgradeModal";
export default function PremiumCta({ startLabel }: { startLabel: string }) {
  const [o, setO] = useState(false);
  return <><button className="btn-primary w-full" onClick={() => setO(true)}>Upgrade to Premium</button><UpgradeModal open={o} onClose={() => setO(false)} feature="Premium" startLabel={startLabel} /></>;
}
