/**
 * Seed script — inserts 5 skin themes for Stripe integration testing.
 * Run with: bun run seed  (from backend/ directory)
 *
 * INV-01: SVG assets in frontend/public/themes/{skin_id}/.
 * Replace with real downloaded assets before production launch.
 * Sources documented in prd.md §19 INV-01.
 */
import { connectDb, col } from "./index.ts";

// _id is a string slug so THEME_ID_TO_SKIN in frontend/src/lib/skins.ts resolves correctly.
// Without explicit _id, MongoDB generates ObjectIds that don't match the slug map.
const themes = [
  {
    _id: "classic_wood",
    name: "Classic Wood",
    description: "Warm wooden board with traditional red and black pieces. Timeless checkers aesthetic.",
    kind: "bundle",
    priceUsdCents: 299,
    stripePriceId: process.env["STRIPE_PRICE_CLASSIC_WOOD"] ?? "price_placeholder_classic_wood",
    boardLightColor: "#DEB887",
    boardDarkColor: "#8B4513",
    redPieceAsset: "/themes/classic_wood/red-man.svg",
    blackPieceAsset: "/themes/classic_wood/black-man.svg",
    previewImageUrl: "/themes/classic_wood/preview.svg",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "neon_glow",
    name: "Neon Glow",
    description: "Futuristic neon pieces on a dark board. Cyberpunk glow effects.",
    kind: "pieces",
    priceUsdCents: 299,
    stripePriceId: process.env["STRIPE_PRICE_NEON_GLOW"] ?? "price_placeholder_neon_glow",
    redPieceAsset: "/themes/neon_glow/red-man.svg",
    blackPieceAsset: "/themes/neon_glow/black-man.svg",
    previewImageUrl: "/themes/neon_glow/preview.svg",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "marble_board",
    name: "Marble Board",
    description: "Elegant marble-textured pieces. Luxury aesthetic with crimson and navy.",
    kind: "bundle",
    priceUsdCents: 399,
    stripePriceId: process.env["STRIPE_PRICE_MARBLE_BOARD"] ?? "price_placeholder_marble_board",
    boardLightColor: "#F5F5F5",
    boardDarkColor: "#696969",
    redPieceAsset: "/themes/marble_board/red-man.svg",
    blackPieceAsset: "/themes/marble_board/black-man.svg",
    previewImageUrl: "/themes/marble_board/preview.svg",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "vector_classic",
    name: "Vector Classic",
    description: "Clean flat vector design. Bold geometric style with sharp contrast.",
    kind: "pieces",
    priceUsdCents: 199,
    stripePriceId: process.env["STRIPE_PRICE_VECTOR_CLASSIC"] ?? "price_placeholder_vector_classic",
    redPieceAsset: "/themes/vector_classic/red-man.svg",
    blackPieceAsset: "/themes/vector_classic/black-man.svg",
    previewImageUrl: "/themes/vector_classic/preview.svg",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "retro_pixel",
    name: "Retro Pixel",
    description: "8-bit pixel art style pieces. Nostalgic retro gaming aesthetic.",
    kind: "pieces",
    priceUsdCents: 99,
    stripePriceId: process.env["STRIPE_PRICE_RETRO_PIXEL"] ?? "price_placeholder_retro_pixel",
    redPieceAsset: "/themes/retro_pixel/red-man.svg",
    blackPieceAsset: "/themes/retro_pixel/black-man.svg",
    previewImageUrl: "/themes/retro_pixel/preview.svg",
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

console.log("Seed complete — 5 themes loaded with slug _id values.");
await (db.client as import("mongodb").MongoClient).close();
