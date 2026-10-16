"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CITIES } from "@/lib/categories";

export type City = { name: string; lat: number; lng: number };
const FALLBACK: City[] = [{ name: "Chicago", lat: 41.8781, lng: -87.6298 }, { name: "Evanston", lat: 42.0451, lng: -87.6877 }, { name: "Oak Park", lat: 41.885, lng: -87.7845 }]
  .filter((c) => CITIES.includes(c.name));
let cache: City[] | null = null;

// Cities come from the `cities` table (editable in Admin → Editor); falls back to the built-in list.
export function useCities(): City[] {
  const [list, setList] = useState<City[]>(cache ?? FALLBACK);
  useEffect(() => {
    if (cache) return;
    createClient().from("cities").select("name,lat,lng").eq("active", true).order("sort").order("name").then(({ data }) => {
      if (data?.length) { cache = data as City[]; setList(cache); }
    });
  }, []);
  return list;
}
export const nearestCity = (cities: City[], lat: number, lng: number) =>
  [...cities].sort((a, b) => (a.lat - lat) ** 2 + (a.lng - lng) ** 2 - ((b.lat - lat) ** 2 + (b.lng - lng) ** 2))[0]?.name ?? cities[0]?.name;
