export const PROMO_END = new Date("2026-12-01T00:00:00-06:00");
export const CREDIT_FRIEND = 1;
export const CREDIT_SUPPLIER = 3;
export const CREDIT_COMMUNITY = 1;
export const CREDITS_PER_MONTH = 5;
export const FREE_COMMUNITY_LIMIT = 3;
export const promoActive = () => Date.now() < PROMO_END.getTime();
export const PROMO_END_LABEL = "December 1";
export const PROMO_FINE_PRINT = "Credits are promotional and have no cash value. Friend and supplier credits count for sign-ups completed before December 1, 2026; community-member credits are ongoing. 5 credits = 1 free month of Premium, banked until Premium launches. Terms may change.";
