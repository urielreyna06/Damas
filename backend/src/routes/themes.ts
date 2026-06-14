import { Hono } from "hono";
import { requireAuth, getClerkUser } from "../clerk/middleware.ts";
import { col } from "../db/index.ts";
import { createCheckoutSession, getStripe } from "../stripe/checkout.ts";

export const themesRouter = new Hono();

// GET /api/themes — public
themesRouter.get("/", async (c) => {
  const allThemes = await col.themes().find({}).toArray();
  return c.json(allThemes);
});

// POST /api/themes/:id/purchase — requires auth
themesRouter.post("/:id/purchase", requireAuth, async (c) => {
  const { clerkUserId } = getClerkUser(c);
  const id = c.req.param("id");

  if (!id) {
    return c.json({ code: "NOT_FOUND", message: "Theme not found" }, 404);
  }

  // themes use slug-strings as _id (e.g. "classic_wood"); collection is typed
  // with ObjectId, so cast as never to reflect the slug-string _id (cf. me.ts).
  const theme = await col.themes().findOne({ _id: id } as never);
  if (!theme) {
    return c.json({ code: "NOT_FOUND", message: "Theme not found" }, 404);
  }

  const frontendUrl = process.env["FRONTEND_URL"] ?? "http://localhost:3000";

  try {
    const checkoutUrl = await createCheckoutSession({
      stripePriceId: theme["stripePriceId"] as string,
      clerkUserId,
      themeId: id,
      successUrl: `${frontendUrl}/shop?success=1&theme=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/shop?canceled=1`,
    });
    return c.json({ checkoutUrl });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return c.json({ code: "STRIPE_ERROR", message: "Could not initiate checkout" }, 502);
  }
});

// POST /api/themes/:id/verify-payment — requires auth
// Fallback for when the Stripe webhook didn't fire (e.g. stripe listen not running).
// Retrieves the session from Stripe API and upserts the UserSkin if payment_status === 'paid'.
themesRouter.post("/:id/verify-payment", requireAuth, async (c) => {
  const { clerkUserId } = getClerkUser(c);
  const id = c.req.param("id");
  const body = await c.req.json<{ checkoutSessionId: string }>();
  const { checkoutSessionId } = body;

  if (!checkoutSessionId) {
    return c.json({ code: "MISSING_SESSION_ID", message: "checkoutSessionId is required" }, 400);
  }

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  } catch (err) {
    console.error("Stripe session retrieve error:", err);
    return c.json({ code: "STRIPE_ERROR", message: "Could not retrieve checkout session" }, 502);
  }

  if (session.payment_status !== "paid") {
    return c.json({ code: "PAYMENT_NOT_COMPLETED", message: "Payment not completed" }, 402);
  }

  const meta = session.metadata ?? {};
  if (meta["themeId"] !== id || meta["clerkUserId"] !== clerkUserId) {
    return c.json({ code: "SESSION_MISMATCH", message: "Session does not match this user/theme" }, 403);
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : (session.payment_intent?.id ?? "");

  await col.userSkins().updateOne(
    { clerkUserId, themeId: id },
    {
      $setOnInsert: {
        clerkUserId,
        themeId: id,
        stripePaymentIntentId: paymentIntentId,
        purchasedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  return c.json({ success: true });
});
