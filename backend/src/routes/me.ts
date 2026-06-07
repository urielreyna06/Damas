import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { requireAuth, getClerkUser } from "../clerk/middleware.ts";
import { col } from "../db/index.ts";

export const meRouter = new Hono();
meRouter.use("*", requireAuth);

// GET /api/me
meRouter.get("/", async (c) => {
  const { clerkUserId, displayName } = getClerkUser(c);
  const now = new Date().toISOString();

  // Upsert user record (keep displayName in sync with Clerk)
  await col.users().updateOne(
    { clerkUserId },
    {
      $setOnInsert: { createdAt: now },
      $set: { displayName, clerkUserId, updatedAt: now },
    },
    { upsert: true }
  );

  const user = await col.users().findOne({ clerkUserId });
  const skins = await col.userSkins().find({ clerkUserId }).toArray();

  let activeTheme = null;
  const activeThemeId = user?.["activeThemeId"] as string | undefined;
  if (activeThemeId && ObjectId.isValid(activeThemeId)) {
    activeTheme = await col.themes().findOne({ _id: new ObjectId(activeThemeId) });
  }

  return c.json({ user, skins, activeTheme });
});

// PUT /api/me/active-theme
meRouter.put("/active-theme", async (c) => {
  const { clerkUserId } = getClerkUser(c);
  const body = await c.req.json<{ themeId: unknown }>();

  if (typeof body.themeId !== "string" || !ObjectId.isValid(body.themeId)) {
    return c.json({ code: "INVALID_THEME_ID", message: "themeId must be a valid id" }, 400);
  }

  // CA-18: verify ownership before activating
  const owned = await col.userSkins().findOne({ clerkUserId, themeId: body.themeId });
  if (!owned) {
    return c.json({ code: "SKIN_NOT_OWNED", message: "You have not purchased this skin" }, 403);
  }

  const now = new Date().toISOString();
  await col.users().updateOne(
    { clerkUserId },
    {
      $setOnInsert: { createdAt: now },
      $set: { activeThemeId: body.themeId, clerkUserId, updatedAt: now },
    },
    { upsert: true }
  );

  return c.json({ ok: true });
});
