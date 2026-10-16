# WOM — what we need to run the business model

Timeline: **Nov** Booth launch (all free) → **Dec** all UChicago (all free) → **Jan** revenue (premium, fees, promotion).

## Revenue streams → what must be built / set up
| Stream | Needs | Apple note |
|---|---|---|
| 2% booking fee | Booking flow (request → accept → pay), **Stripe Connect** (Express), payouts, receipts, refunds/disputes policy | Real-world services are exempt from in-app purchase (Guideline 3.1.3(e)), so Stripe is OK in the iOS app |
| Fee-avoidance / invoicing sub ($5) | Stripe Billing for suppliers, invoice tool | Sell on the **web**; don't link to it from the iOS app |
| Promotion ($30, "Google model") | Sponsored placement in `rankProviders`, clearly labelled "Sponsored", budget/duration, supplier checkout | Web checkout only |
| Lead list ($20) | Opt-in consent from users before sharing details; export | Privacy-label + consent copy |
| Premium users ($2.50) | Entitlements, paywall, Apple **In-App Purchase** (StoreKit) for iOS + Stripe on web | Digital subscription → IAP required; Apple takes 15% via Small Business Program |

## Company & legal (before January)
Incorporate (Delaware C-corp or LLC) · EIN + business bank account · Stripe account in the company's name · Apple Developer *Organization* account (needs D-U-N-S) · Terms/Privacy reviewed by counsel (marketplace, UGC, payments, referrals/credits) · sales-tax treatment of fees · supplier T&Cs (independent contractors, insurance, vetting) · trademark search for WOM + domain · referral-credit liability (credits promised → define expiry/redemption).

## Unit economics warning
At 2% on a $70 job we earn $1.40; card processing is ≈ 2.9% + $0.30 ≈ $2.33. Raise the fee to ≥ 4–5%, charge the fee on top, or take it from the supplier payout.

## Build order
1. (done) Admin console, analytics, report/block, native app features, push
2. Entitlements + free-period gate (premium_start setting) — started
3. Supplier plans + sponsored ranking
4. Booking + Stripe Connect
5. IAP for Premium (StoreKit via RevenueCat)
6. Lead-list consent + export
