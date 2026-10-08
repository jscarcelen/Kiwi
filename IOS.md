# Kiwi iPhone app (Capacitor)

The iOS app is a native shell that loads the live site (https://kiwi-mu-red.vercel.app) and adds native features — currently **one-tap contacts import**. Web updates reach the app instantly; you only resubmit to Apple when native code changes.

## One-time prerequisites
1. Enroll in the **Apple Developer Program** ($99/yr, developer.apple.com/programs). Approval can take 1–2 days; use an individual account to be fastest.
2. A Mac with **Xcode** (App Store) and CocoaPods (`brew install cocoapods`).
3. Optional: edit `appId` in `capacitor.config.ts` (default `app.kiwi.marketplace`) — it must match the Bundle ID you register.

## Build steps (Mac)
```bash
git pull && npm install
npm run ios:add        # generates the ios/ project (once)
npm run ios:setup      # adds contacts permission text, syncs
npm run ios:open       # opens Xcode
```
In Xcode: select the **App** target → *Signing & Capabilities* → pick your Team and set the Bundle Identifier. Replace the app icon with `ios-assets/AppIcon-1024.png` (Assets → AppIcon). Plug in your iPhone, press ▶ to test: sign in → My network → **Find friends in my contacts** should show the iOS permission prompt.

## Ship to friends (TestFlight)
Product → Archive → Distribute App → App Store Connect → Upload. In App Store Connect → TestFlight, add testers by email (internal testers need no review; external testers need a short Beta review).

## App Store review checklist
- **Account deletion** (required): done — run `supabase/account_deletion.sql`. Button is on My network.
- **Privacy policy URL**: https://kiwi-mu-red.vercel.app/privacy (have it reviewed). Fill in App Privacy "nutrition labels" (contact info, contacts, user content).
- **Sign in with Apple** is required only if you offer other social logins; the Instagram button is hidden inside the app, so phone/email only is fine.
- **Minimum functionality (4.2)**: Apple may reject plain website wrappers. Native contacts import helps; adding push notifications or Share extensions later strengthens it.
- **User-generated content (1.2)**: reviews need a way to report/block abusive content before a public release — not built yet.
- Provide a demo login (email + password) in the review notes, and screenshots (6.7" iPhone).
