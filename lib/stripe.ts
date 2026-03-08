import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
}

let _stripe: Stripe | null = null;

function stripe() {
  if (!_stripe) _stripe = getStripe();
  return _stripe;
}

export default stripe;
