import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("STRIPE_SECRET_KEY env var is required");
    stripeClient = new Stripe(key, { apiVersion: "2024-06-20" });
  }
  return stripeClient;
}

export async function createCheckoutSession(params: {
  stripePriceId: string;
  clerkUserId: string;
  themeId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: params.stripePriceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      clerkUserId: params.clerkUserId,
      themeId: params.themeId,
    },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}
