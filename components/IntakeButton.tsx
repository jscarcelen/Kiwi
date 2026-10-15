"use client";
import { useState } from "react";
import IntakeModal from "./IntakeModal";

export default function IntakeButton({ children, className, initialCategory = null, initialText = "", city }: { children: React.ReactNode; className?: string; initialCategory?: string | null; initialText?: string; city?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
      {open && <IntakeModal open onClose={() => setOpen(false)} initialCategory={initialCategory} initialText={initialText} city={city} />}
    </>
  );
}
