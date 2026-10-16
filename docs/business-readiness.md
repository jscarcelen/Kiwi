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


## Spain-based company selling worldwide — payments architecture
**Paddle (merchant of record)** handles VAT/sales tax in most countries, invoices and chargebacks, at ≈5% + $0.50 per transaction (verify on paddle.com/pricing). But its Acceptable Use Policy excludes marketplaces where non-Paddle sellers transact, standalone human services, and "advertising/sponsorship where no real software is sold". So:
| Stream | Use | Why |
|---|---|---|
| Premium users (filters, communities) | Paddle on web + **Apple IAP** in iOS | Software feature; Apple requires IAP outside the US |
| Supplier invoicing / fee-avoidance sub | Paddle (web only) | It's a SaaS tool |
| Promotion, lead list | **Ask Paddle in writing first**; fallback Stripe | Could be classed as advertising / marketplace |
| Booking fee (2–5%) | **Stripe Connect** (available in Spain) | Marketplace split payments; Paddle can't do this |

Watch: Paddle's flat $0.50 makes a $2.50/month plan lose ≈25% to fees — sell annual or raise price. Stripe Connect Express adds platform/payout fees (verify euro pricing). EEA cards ≈1.5% + €0.25; non-EEA ≈3.25% + FX. Handling customer money may have PSD2/payment-institution implications — Stripe Connect covers this if you stay within its model; confirm with a lawyer.

## Spain checklist
SL (sociedad limitada) vs autónomo · NIF/CIF + bank account · gestoría for IVA/IRPF/corporate tax · Stripe + Paddle accounts in the SL's name · D-U-N-S for the Apple organization account (Spain-based) · RGPD/GDPR compliance (privacy policy, DPA with Supabase/Vercel/OpenAI, contacts-upload consent, cookie banner for EU users) · EU consumer-law withdrawal rules for subscriptions · DSA notice-and-action for user content (report flow built) · Verifactu/e-invoicing rules for your own invoices (ask gestor).

The admin → Revenue tab models all of this: processor fees by stream, Apple's cut, refunds, fixed and variable costs, tax, break-even users and scale scenarios.
