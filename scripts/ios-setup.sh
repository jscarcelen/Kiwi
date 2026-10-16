#!/bin/bash
# Run on a Mac after `npm run ios:add`. Adds the permission text iOS requires, generates icons + splash, syncs the native project.
set -e
PLIST=ios/App/App/Info.plist
setstr() { /usr/libexec/PlistBuddy -c "Add :$1 string $2" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :$1 $2" "$PLIST"; }
setstr NSContactsUsageDescription "WOM uses your contacts to find friends who are already on WOM. Contacts are matched on the fly and never stored."
setstr NSLocationWhenInUseUsageDescription "WOM uses your location once to pre-select your city when you search for pros."
setstr NSPhotoLibraryUsageDescription "WOM lets you choose a profile or business photo from your library."
setstr NSCameraUsageDescription "WOM lets you take a profile or business photo."
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :UIBackgroundModes array" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :UIBackgroundModes:0 string remote-notification" "$PLIST" 2>/dev/null || true
# app icon + splash from ios-assets/ (icon-only.png 1024px, splash-2732.png)
npx --yes @capacitor/assets generate --ios --iconBackgroundColor '#051C2C' --splashBackgroundColor '#051C2C' --assetPath ios-assets || echo "(assets generation skipped — set icon/splash manually in Xcode)"
npx cap sync ios
echo "Done. In Xcode: Signing & Capabilities → + Capability → Push Notifications. Then: npm run ios:open"
