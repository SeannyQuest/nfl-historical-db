import Stripe from "stripe";
import { SubscriptionTier } from "@prisma/client";

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripe = new Stripe(apiKey);
  }
  return stripe;
}

export const PRICE_IDS: Record<SubscriptionTier, string> = {
  FREE: "",
  PRO: process.env.STRIPE_PRICE_ID_PRO || "",
  ADMIN: process.env.STRIPE_PRICE_ID_ADMIN || "",
};

export async function createCheckoutSession(
  userId: string,
  tier: SubscriptionTier,
  customerId?: string
): Promise<string | null> {
  if (!PRICE_IDS[tier]) {
    return null;
  }

  try {
    const stripeClient = getStripe();
    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[tier],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account`,
      metadata: {
        userId,
        tier,
      },
    });

    return session.url;
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return null;
  }
}

export async function createPortalSession(
  customerId: string
): Promise<string | null> {
  try {
    const stripeClient = getStripe();
    const session = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account`,
    });

    return session.url;
  } catch (error) {
    console.error("Stripe portal error:", error);
    return null;
  }
}

export async function getSubscriptionStatus(
  subscriptionId: string
): Promise<string | null> {
  try {
    const stripeClient = getStripe();
    const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
    return subscription.status;
  } catch (error) {
    console.error("Stripe subscription error:", error);
    return null;
  }
}

export function getTierFromPrice(priceId: string): SubscriptionTier {
  for (const [tier, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) {
      return tier as SubscriptionTier;
    }
  }
  return SubscriptionTier.FREE;
}

export function getStripeSigningSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return secret;
}
