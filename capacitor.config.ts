import type { CapacitorConfig } from "@capacitor/cli";

// The iOS app is a native shell that loads the live WOM site and adds native features (e.g. contacts import).
// Change appId to your own bundle identifier once you create the Apple Developer account.
const config: CapacitorConfig = {
  appId: "app.wom.marketplace",
  appName: "WOM",
  webDir: "capacitor-www",
  // errorPath: shown from capacitor-www when the live site can't be reached (no signal).
  server: { url: "https://kiwi-mu-red.vercel.app", cleartext: false, errorPath: "offline.html" },
  // contentInset "never": the web app handles safe areas itself with env(safe-area-inset-*).
  ios: { contentInset: "never", backgroundColor: "#051C2C" },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: "#051C2C", showSpinner: false },
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
  },
};
export default config;
