"use client";
// Helpers for the Capacitor iOS shell. Everything degrades gracefully on the plain web.
export const isNative = () => typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();

export async function haptic(kind: "light" | "medium" | "success" = "light") {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (kind === "success") await Haptics.notification({ type: NotificationType.Success });
    else await Haptics.impact({ style: kind === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch { /* ignore */ }
}

export const canShareNatively = () => typeof navigator !== "undefined" && (isNative() || !!navigator.share);

// Opens the real iOS share sheet in the app, the Web Share API on supporting browsers.
export async function shareNative(opts: { title?: string; text?: string; url?: string }): Promise<boolean> {
  try {
    if (isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title: opts.title, text: opts.text, url: opts.url, dialogTitle: opts.title });
      return true;
    }
    if (navigator.share) { await navigator.share(opts); return true; }
  } catch { /* user cancelled */ }
  return false;
}
