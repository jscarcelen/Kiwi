"use client";
import { useEffect } from "react";
import { track } from "@/lib/track";
export default function TrackEvent({ type, meta }: { type: string; meta?: Record<string, unknown> }) {
  const k = JSON.stringify(meta ?? {});
  useEffect(() => { track(type, JSON.parse(k)); }, [type, k]);
  return null;
}
