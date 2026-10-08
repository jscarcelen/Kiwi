#!/bin/bash
# Run on a Mac after `npm run ios:add`. Adds the permission text iOS requires, then syncs the native project.
set -e
PLIST=ios/App/App/Info.plist
MSG="Kiwi uses your contacts to find friends who are already on Kiwi. Contacts are matched on the fly and never stored."
/usr/libexec/PlistBuddy -c "Add :NSContactsUsageDescription string $MSG" "$PLIST" 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :NSContactsUsageDescription $MSG" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST" 2>/dev/null || true
npx cap sync ios
echo "Done. Now run: npm run ios:open"
