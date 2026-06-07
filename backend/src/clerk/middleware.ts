import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Context, Next } from "hono";

const clerk = createClerkClient({
  secretKey: process.env["CLERK_SECRET_KEY"] ?? "",
});

export interface ClerkUser {
  clerkUserId: string;
  displayName: string;
}

declare module "hono" {
  interface ContextVariableMap {
    clerkUser: ClerkUser;
  }
}

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ code: "UNAUTHORIZED", message: "Missing Bearer token" }, 401);
  }
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, { secretKey: process.env["CLERK_SECRET_KEY"] ?? "" });
    const clerkUserId = payload.sub;

    // Fetch display name from Clerk
    const user = await clerk.users.getUser(clerkUserId);
    const displayName =
      user.fullName ??
      user.username ??
      user.emailAddresses[0]?.emailAddress ??
      clerkUserId;

    c.set("clerkUser", { clerkUserId, displayName });
    await next();
  } catch {
    return c.json({ code: "UNAUTHORIZED", message: "Invalid or expired token" }, 401);
  }
}

export function getClerkUser(c: Context): ClerkUser {
  return c.get("clerkUser");
}
