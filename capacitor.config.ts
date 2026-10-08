import type { CapacitorConfig } from "@capacitor/cli";

// The iOS app is a native shell that loads the live Kiwi site and adds native features (e.g. contacts import).
// Change appId to your own bundle identifier once you create the Apple Developer account.
const config: CapacitorConfig = {
  appId: "app.kiwi.marketplace",
  appName: "Kiwi",
  webDir: "capacitor-www",
  server: { url: "https://kiwi-mu-red.vercel.app", cleartext: false },
  ios: { contentInset: "automatic", backgroundColor: "#fbfbfd" },
};
export default config;
