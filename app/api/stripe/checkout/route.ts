import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { PLANS, type PlanKey } from "@/lib/stripe-config";

export async function POST(_req: Request) {
  return NextResponse.json({ error: "Pro subscriptions coming soon" }, { status: 403 });
  // eslint-disable-next-line no-unreachable
  console.log("[stripe/checkout] STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const planKey = body.plan as PlanKey;

    if (!planKey || !PLANS[planKey]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan = PLANS[planKey];
    console.log("[stripe/checkout] plan:", planKey, "priceId:", plan.priceId);

    if (!plan.priceId) {
      return NextResponse.json({ error: "Plan not yet available" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Look up or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: user.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Determine success/cancel URLs based on plan type
    const isBusinessPlan = planKey.startsWith("business_");
    const successUrl = isBusinessPlan
      ? `${process.env.NEXTAUTH_URL}/business/dashboard?success=true`
      : `${process.env.NEXTAUTH_URL}/pro?success=true`;
    const cancelUrl = isBusinessPlan
      ? `${process.env.NEXTAUTH_URL}/business/dashboard?canceled=true`
      : `${process.env.NEXTAUTH_URL}/pro?canceled=true`;

    const checkoutSession = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: session.user.id, plan: planKey },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
