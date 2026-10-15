"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { insertExtraServices, type ExtraService } from "@/lib/extraServices";

/** After the email is confirmed and the pro signs in for the first time: creates the extra services they picked at sign-up. */
export default function ApplyPendingServices() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const s = createClient();
      const { data } = await s.auth.getUser();
      const extras = data.user?.user_metadata?.extra_services as ExtraService[] | undefined;
      if (!data.user || !Array.isArray(extras) || !extras.length) return;
      await insertExtraServices(s, data.user.id, extras);
      await s.auth.updateUser({ data: { extra_services: null } });
      router.refresh();
    })();
  }, [router]);
  return null;
}
