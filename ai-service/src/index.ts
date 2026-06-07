import { Hono } from "hono";
import { router } from "./routes.ts";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));
app.route("/", router);

const port = Number(process.env["PORT"] ?? 3002);

export default { port, fetch: app.fetch };
