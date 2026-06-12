/**
 * Seed script — inserts 13 skin themes for Stripe integration testing.
 * Run with: bun run seed  (from backend/ directory, or via docker exec)
 *
 * _id is a string slug so resolveSkin() in frontend/src/lib/skins.ts resolves correctly.
 * Without explicit _id, MongoDB generates ObjectIds that don't match the slug map.
 */
import { connectDb, col } from "./index.ts";

const themes = [
  // ── CSS-only skins ────────────────────────────────────────────────────────
  {
    _id: "emerald",
    name: "Emerald Classic",
    description: "Deep emerald & cream — the house style. Free for everyone.",
    tag: "Default",
    priceUsdCents: 0,
    stripePriceId: null,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "wood",
    name: "Classic Wood",
    description: "Hand-finished walnut board with carved timber pieces.",
    tag: "Warm",
    priceUsdCents: 299,
    stripePriceId: process.env["STRIPE_PRICE_WOOD"] ?? process.env["STRIPE_PRICE_CLASSIC_WOOD"] ?? "price_placeholder_wood",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "neon",
    name: "Neon Glow",
    description: "Carbon grid, electric magenta vs cyan with bloom.",
    tag: "Cyberpunk",
    priceUsdCents: 299,
    stripePriceId: process.env["STRIPE_PRICE_NEON"] ?? process.env["STRIPE_PRICE_NEON_GLOW"] ?? "price_placeholder_neon",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "marble",
    name: "Marble Board",
    description: "Carrara & onyx marble with polished stone discs.",
    tag: "Elegant",
    priceUsdCents: 399,
    stripePriceId: process.env["STRIPE_PRICE_MARBLE"] ?? process.env["STRIPE_PRICE_MARBLE_BOARD"] ?? "price_placeholder_marble",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "vector",
    name: "Vector Classic",
    description: "Flat, clean, high-contrast vector minimalism.",
    tag: "Minimal",
    priceUsdCents: 199,
    stripePriceId: process.env["STRIPE_PRICE_VECTOR"] ?? process.env["STRIPE_PRICE_VECTOR_CLASSIC"] ?? "price_placeholder_vector",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "pixel",
    name: "Retro Pixel",
    description: "Chunky 8-bit arcade vibe, no anti-aliasing.",
    tag: "8-bit",
    priceUsdCents: 99,
    stripePriceId: process.env["STRIPE_PRICE_PIXEL"] ?? process.env["STRIPE_PRICE_RETRO_PIXEL"] ?? "price_placeholder_pixel",
    createdAt: new Date().toISOString(),
  },
  // ── PNG clan skins — tiles/pieces/frame loaded from /skins/{_id}/*.png ───
  {
    _id: "templo",
    name: "Templo del Tiempo",
    description: "Ancient stone tiles, bronze-clad warriors — timeless relics on every square.",
    tag: "Fantasy",
    priceUsdCents: 399,
    stripePriceId: process.env["STRIPE_PRICE_TEMPLO"] ?? "price_placeholder_templo",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "desierto",
    name: "Clan del Desierto",
    description: "Golden sand and crescent steel — warriors of sun and moon clash at dusk.",
    tag: "Dorado",
    priceUsdCents: 399,
    stripePriceId: process.env["STRIPE_PRICE_DESIERTO"] ?? "price_placeholder_desierto",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "bosque",
    name: "Clan del Bosque",
    description: "Tangled roots, emerald canopy — ancient spirits guard the living board.",
    tag: "Natural",
    priceUsdCents: 399,
    stripePriceId: process.env["STRIPE_PRICE_BOSQUE"] ?? "price_placeholder_bosque",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "hada",
    name: "Clan de las Hadas",
    description: "Crystal petals and luminous orbs — magic blooms across every square.",
    tag: "Mágico",
    priceUsdCents: 399,
    stripePriceId: process.env["STRIPE_PRICE_HADA"] ?? "price_placeholder_hada",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "fuego",
    name: "Clan del Fuego",
    description: "Molten obsidian and flame elementals — every move scorches the board.",
    tag: "Volcánico",
    priceUsdCents: 399,
    stripePriceId: process.env["STRIPE_PRICE_FUEGO"] ?? "price_placeholder_fuego",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "agua",
    name: "Clan del Agua",
    description: "Translucent ice and deep-sea creatures — the tide decides every battle.",
    tag: "Marino",
    priceUsdCents: 399,
    stripePriceId: process.env["STRIPE_PRICE_AGUA"] ?? "price_placeholder_agua",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "sombra",
    name: "Clan de la Sombra",
    description: "Runic obsidian and spectral chains — shadow and silence consume the board.",
    tag: "Oscuro",
    priceUsdCents: 399,
    stripePriceId: process.env["STRIPE_PRICE_SOMBRA"] ?? "price_placeholder_sombra",
    createdAt: new Date().toISOString(),
  },
];

const db = await connectDb();

// Drop and recreate so old ObjectId _id documents don't persist alongside slug ones.
// userSkins references themeId → also drop to avoid stale references.
await col.themes().drop().catch(() => {});
await col.userSkins().drop().catch(() => {});
console.log("Dropped themes and userSkins collections.");

for (const theme of themes) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await col.themes().replaceOne({ _id: theme._id } as any, theme as any, { upsert: true });
  console.log(`Upserted theme: ${theme.name} (_id: ${theme._id})`);
}

console.log("Seed complete — 13 themes loaded with slug _id values.");
await (db.client as import("mongodb").MongoClient).close();
