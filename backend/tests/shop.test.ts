import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// ─── Hoisted mocks (must precede imports) ─────────────────────────────────────

const {
  mockThemesFindOne,
  mockUserSkinsFindOne,
  mockUserSkinsFind,
  mockUserSkinsUpdateOne,
  mockUsersFindOne,
  mockUsersUpdateOne,
  mockCreateCheckoutSession,
  mockSessionsRetrieve,
  mockConstructEventAsync,
} = vi.hoisted(() => ({
  mockThemesFindOne: vi.fn(),
  mockUserSkinsFindOne: vi.fn(),
  mockUserSkinsFind: vi.fn(),
  mockUserSkinsUpdateOne: vi.fn(),
  mockUsersFindOne: vi.fn(),
  mockUsersUpdateOne: vi.fn(),
  mockCreateCheckoutSession: vi.fn(),
  mockSessionsRetrieve: vi.fn(),
  mockConstructEventAsync: vi.fn(),
}));

vi.mock("../src/db/index.ts", () => ({
  connectDb: vi.fn(),
  getDb: vi.fn(),
  col: {
    themes: () => ({ findOne: mockThemesFindOne }),
    userSkins: () => ({
      findOne: mockUserSkinsFindOne,
      find: mockUserSkinsFind,
      updateOne: mockUserSkinsUpdateOne,
    }),
    users: () => ({ findOne: mockUsersFindOne, updateOne: mockUsersUpdateOne }),
  },
}));

vi.mock("../src/clerk/middleware.ts", () => ({
  requireAuth: (_c: unknown, next: () => Promise<void>) => next(),
  getClerkUser: () => ({ clerkUserId: "user_test_clerk_123", displayName: "Test Player" }),
}));

// getStripe() is used by both themes.ts (verify-payment) and webhook.ts; the fake
// client exposes only the two surfaces those routes touch.
vi.mock("../src/stripe/checkout.ts", () => ({
  createCheckoutSession: mockCreateCheckoutSession,
  getStripe: () => ({
    checkout: { sessions: { retrieve: mockSessionsRetrieve } },
    webhooks: { constructEventAsync: mockConstructEventAsync },
  }),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { themesRouter } from "../src/routes/themes.ts";
import { meRouter } from "../src/routes/me.ts";
import { stripeWebhookRouter } from "../src/stripe/webhook.ts";

const USER = "user_test_clerk_123";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── POST /:id/purchase ───────────────────────────────────────────────────────

describe("POST /api/themes/:id/purchase", () => {
  it("returns 200 with a checkoutUrl for an existing theme", async () => {
    mockThemesFindOne.mockResolvedValue({ _id: "wood", stripePriceId: "price_wood" });
    mockCreateCheckoutSession.mockResolvedValue("https://checkout.stripe.test/session_abc");

    const res = await themesRouter.request("/wood/purchase", { method: "POST" });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data["checkoutUrl"]).toBe("https://checkout.stripe.test/session_abc");
    // success_url must carry the {CHECKOUT_SESSION_ID} template for the verify-payment fallback
    const args = mockCreateCheckoutSession.mock.calls[0]![0] as Record<string, string>;
    expect(args["successUrl"]).toContain("{CHECKOUT_SESSION_ID}");
    expect(args["themeId"]).toBe("wood");
  });

  it("returns 404 NOT_FOUND when the theme does not exist", async () => {
    mockThemesFindOne.mockResolvedValue(null);
    const res = await themesRouter.request("/ghost/purchase", { method: "POST" });
    expect(res.status).toBe(404);
    expect(((await res.json()) as Record<string, unknown>)["code"]).toBe("NOT_FOUND");
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns 502 STRIPE_ERROR when Stripe checkout creation fails", async () => {
    mockThemesFindOne.mockResolvedValue({ _id: "wood", stripePriceId: "price_wood" });
    mockCreateCheckoutSession.mockRejectedValue(new Error("stripe down"));
    const res = await themesRouter.request("/wood/purchase", { method: "POST" });
    expect(res.status).toBe(502);
    expect(((await res.json()) as Record<string, unknown>)["code"]).toBe("STRIPE_ERROR");
  });
});

// ─── POST /:id/verify-payment ─────────────────────────────────────────────────

describe("POST /api/themes/:id/verify-payment", () => {
  function post(themeId: string, body: unknown) {
    return themesRouter.request(`/${themeId}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 400 when checkoutSessionId is missing", async () => {
    const res = await post("wood", {});
    expect(res.status).toBe(400);
    expect(((await res.json()) as Record<string, unknown>)["code"]).toBe("MISSING_SESSION_ID");
  });

  it("returns 402 when the payment is not completed", async () => {
    mockSessionsRetrieve.mockResolvedValue({ payment_status: "unpaid", metadata: {} });
    const res = await post("wood", { checkoutSessionId: "cs_1" });
    expect(res.status).toBe(402);
    expect(mockUserSkinsUpdateOne).not.toHaveBeenCalled();
  });

  it("returns 403 when the session metadata does not match user/theme", async () => {
    mockSessionsRetrieve.mockResolvedValue({
      payment_status: "paid",
      metadata: { clerkUserId: "someone_else", themeId: "wood" },
    });
    const res = await post("wood", { checkoutSessionId: "cs_1" });
    expect(res.status).toBe(403);
    expect(mockUserSkinsUpdateOne).not.toHaveBeenCalled();
  });

  it("returns 200 and upserts the UserSkin when payment is paid and matches (CA-17 fallback)", async () => {
    mockSessionsRetrieve.mockResolvedValue({
      payment_status: "paid",
      payment_intent: "pi_123",
      metadata: { clerkUserId: USER, themeId: "wood" },
    });
    mockUserSkinsUpdateOne.mockResolvedValue({ upsertedCount: 1 });

    const res = await post("wood", { checkoutSessionId: "cs_1" });
    expect(res.status).toBe(200);
    expect(((await res.json()) as Record<string, unknown>)["success"]).toBe(true);

    expect(mockUserSkinsUpdateOne).toHaveBeenCalledTimes(1);
    const [filter, update, opts] = mockUserSkinsUpdateOne.mock.calls[0]!;
    expect(filter).toEqual({ clerkUserId: USER, themeId: "wood" });
    expect((update as Record<string, Record<string, unknown>>)["$setOnInsert"]!["stripePaymentIntentId"]).toBe("pi_123");
    expect(opts).toEqual({ upsert: true }); // idempotent
  });
});

// ─── PUT /api/me/active-theme (CA-18) ─────────────────────────────────────────

describe("PUT /api/me/active-theme", () => {
  function put(body: unknown) {
    return meRouter.request("/active-theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 400 for an invalid themeId", async () => {
    const res = await put({ themeId: "" });
    expect(res.status).toBe(400);
  });

  it("returns 403 SKIN_NOT_OWNED when the user does not own the skin (CA-18)", async () => {
    mockUserSkinsFindOne.mockResolvedValue(null);
    const res = await put({ themeId: "wood" });
    expect(res.status).toBe(403);
    expect(((await res.json()) as Record<string, unknown>)["code"]).toBe("SKIN_NOT_OWNED");
    expect(mockUsersUpdateOne).not.toHaveBeenCalled();
  });

  it("returns 200 and persists the active theme when owned", async () => {
    mockUserSkinsFindOne.mockResolvedValue({ clerkUserId: USER, themeId: "wood" });
    mockUsersUpdateOne.mockResolvedValue({ acknowledged: true });
    const res = await put({ themeId: "wood" });
    expect(res.status).toBe(200);
    expect(mockUsersUpdateOne).toHaveBeenCalledTimes(1);
    const [, update] = mockUsersUpdateOne.mock.calls[0]!;
    expect((update as Record<string, Record<string, unknown>>)["$set"]!["activeThemeId"]).toBe("wood");
  });
});

// ─── POST /api/stripe/webhook (CA-17) ─────────────────────────────────────────

describe("POST /api/stripe/webhook", () => {
  const OLD_SECRET = process.env["STRIPE_WEBHOOK_SECRET"];
  beforeEach(() => {
    process.env["STRIPE_WEBHOOK_SECRET"] = "whsec_test";
  });
  afterAll(() => {
    if (OLD_SECRET === undefined) delete process.env["STRIPE_WEBHOOK_SECRET"];
    else process.env["STRIPE_WEBHOOK_SECRET"] = OLD_SECRET;
  });

  it("returns 400 MISSING_SIGNATURE when the stripe-signature header is absent", async () => {
    const res = await stripeWebhookRouter.request("/", { method: "POST", body: "{}" });
    expect(res.status).toBe(400);
    expect(((await res.json()) as Record<string, unknown>)["code"]).toBe("MISSING_SIGNATURE");
  });

  it("returns 400 INVALID_SIGNATURE when verification throws", async () => {
    mockConstructEventAsync.mockRejectedValue(new Error("bad signature"));
    const res = await stripeWebhookRouter.request("/", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=deadbeef" },
      body: "{}",
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as Record<string, unknown>)["code"]).toBe("INVALID_SIGNATURE");
  });

  it("unlocks the skin on checkout.session.completed (CA-17, async verification under Bun)", async () => {
    mockConstructEventAsync.mockResolvedValue({
      type: "checkout.session.completed",
      data: { object: { payment_intent: "pi_999", metadata: { clerkUserId: USER, themeId: "wood" } } },
    });
    mockUserSkinsUpdateOne.mockResolvedValue({ upsertedCount: 1 });

    const res = await stripeWebhookRouter.request("/", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=valid" },
      body: JSON.stringify({ ok: true }),
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as Record<string, unknown>)["received"]).toBe(true);
    expect(mockConstructEventAsync).toHaveBeenCalledTimes(1); // async variant required under Bun
    expect(mockUserSkinsUpdateOne).toHaveBeenCalledTimes(1);
    const [filter] = mockUserSkinsUpdateOne.mock.calls[0]!;
    expect(filter).toEqual({ clerkUserId: USER, themeId: "wood" });
  });
});
