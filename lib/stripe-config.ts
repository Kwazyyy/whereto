export const PLANS = {
  pro_monthly: {
    name: "Savrd Pro Monthly",
    price: 599,
    currency: "cad",
    interval: "month" as const,
    // test: price_1T8mK7J8EXj4YJm9Z7FuamaT
    priceId: "price_1T8pCQJrG6rEtfiBPgPJPHFw",
  },
  pro_yearly: {
    name: "Savrd Pro Yearly",
    price: 4999,
    currency: "cad",
    interval: "year" as const,
    // test: price_1T8mNZJ8EXj4YJm9YXiQ3uZR
    priceId: "price_1T8pCOJrG6rEtfiB2wL4YXnv",
  },
  business_starter: {
    name: "Business Starter",
    price: 2900,
    currency: "cad",
    interval: "month" as const,
    // test: price_1T8mOeJ8EXj4YJm9W5rhLjtU
    priceId: "price_1T8pCPJrG6rEtfiBpcNJ7vhD",
  },
  business_growth: {
    name: "Business Growth",
    price: 7900,
    currency: "cad",
    interval: "month" as const,
    // test: price_1T8mPNJ8EXj4YJm9USmcoTq0
    priceId: "price_1T8pCSJrG6rEtfiBTyu0hGib",
  },
  business_pro: {
    name: "Business Pro",
    price: 19900,
    currency: "cad",
    interval: "month" as const,
    // test: price_1T8mPvJ8EXj4YJm9cSHo6VMC
    priceId: "price_1T8pCOJrG6rEtfiBiHFd27h1",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
