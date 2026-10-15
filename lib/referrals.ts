export const PROMO_END = new Date("2026-12-01T00:00:00-06:00");
export const CREDIT_FRIEND = 1;
export const CREDIT_SUPPLIER = 3;
export const promoActive = () => Date.now() < PROMO_END.getTime();
export const PROMO_END_LABEL = "December 1";
export const PROMO_FINE_PRINT = "Credits are promotional, have no cash value yet, and become cashback on premium features once they launch. Only sign-ups completed before December 1, 2026 count. Terms may change.";
