import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { requireAuth, getClerkUser } from "../clerk/middleware.ts";
import { col } from "../db/index.ts";
import { createCheckoutSession } from "../stripe/checkout.ts";

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

  if (!id || !ObjectId.isValid(id)) {
    return c.json({ code: "NOT_FOUND", message: "Theme not found" }, 404);
  }

  const theme = await col.themes().findOne({ _id: new ObjectId(id) });
  if (!theme) {
    return c.json({ code: "NOT_FOUND", message: "Theme not found" }, 404);
  }

  const frontendUrl = process.env["FRONTEND_URL"] ?? "http://localhost:3000";

  try {
    const checkoutUrl = await createCheckoutSession({
      stripePriceId: theme["stripePriceId"] as string,
      clerkUserId,
      themeId: id,
      successUrl: `${frontendUrl}/shop?success=1&theme=${id}`,
      cancelUrl: `${frontendUrl}/shop?canceled=1`,
    });
    return c.json({ checkoutUrl });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return c.json({ code: "STRIPE_ERROR", message: "Could not initiate checkout" }, 502);
  }
});
