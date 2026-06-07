import { Hono } from "hono";
import Stripe from "stripe";
import { getStripe } from "./checkout.ts";
import { col } from "../db/index.ts";

export const stripeWebhookRouter = new Hono();

// POST /api/stripe/webhook
// Must receive the raw body for signature verification — registered before any JSON middleware
stripeWebhookRouter.post("/", async (c) => {
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return c.json({ code: "CONFIG_ERROR" }, 500);
  }

  const sig = c.req.header("stripe-signature");
  if (!sig) return c.json({ code: "MISSING_SIGNATURE" }, 400);

  const rawBody = await c.req.text();

  let event: Stripe.Event;
  try {
    // constructEventAsync (not constructEvent) is required under Bun: Stripe's
    // SubtleCryptoProvider only computes HMAC asynchronously, so the synchronous
    // variant throws "cannot be used in a synchronous context" and every real
    // webhook would fail signature verification (skin unlocks silently lost).
    event = await getStripe().webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return c.json({ code: "INVALID_SIGNATURE" }, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutCompleted(session);
  }

  return c.json({ received: true });
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const clerkUserId = session.metadata?.["clerkUserId"];
  const themeId = session.metadata?.["themeId"];
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? "");

  if (!clerkUserId || !themeId) {
    console.error("checkout.session.completed missing metadata", { clerkUserId, themeId });
    return;
  }

  // CA-17: persist UserSkin — idempotent via upsert
  await col.userSkins().updateOne(
    { clerkUserId, themeId },
    {
      $setOnInsert: {
        clerkUserId,
        themeId,
        stripePaymentIntentId: paymentIntentId,
        purchasedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  console.log(`Skin unlocked: user=${clerkUserId} theme=${themeId}`);
}
