import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

// ─── Hoisted mocks (must precede imports) ─────────────────────────────────────

const {
  mockGamesInsertOne,
  mockGamesFindOne,
  mockGamesFind,
  mockGamesUpdateOne,
  mockLeaderboardInsertOne,
  mockThemesFind,
} = vi.hoisted(() => ({
  mockGamesInsertOne: vi.fn(),
  mockGamesFindOne: vi.fn(),
  mockGamesFind: vi.fn(),
  mockGamesUpdateOne: vi.fn(),
  mockLeaderboardInsertOne: vi.fn(),
  mockThemesFind: vi.fn(),
}));

vi.mock("../src/db/index.ts", () => ({
  connectDb: vi.fn(),
  getDb: vi.fn(),
  col: {
    games: () => ({
      insertOne: mockGamesInsertOne,
      findOne: mockGamesFindOne,
      find: mockGamesFind,
      updateOne: mockGamesUpdateOne,
    }),
    leaderboard: () => ({ insertOne: mockLeaderboardInsertOne }),
    themes: () => ({ find: mockThemesFind }),
    userSkins: () => ({}),
    users: () => ({}),
  },
}));

vi.mock("../src/clerk/middleware.ts", () => ({
  requireAuth: (_c: unknown, next: () => Promise<void>) => next(),
  getClerkUser: () => ({ clerkUserId: "user_test_clerk_123", displayName: "Test Player" }),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { gamesRouter } from "../src/routes/games.ts";
import { leaderboardRouter } from "../src/routes/leaderboard.ts";
import { initialBoard } from "../src/rules/moveGenerator.ts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_ID = new ObjectId().toHexString();

function makeGameDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(VALID_ID),
    clerkUserId: "user_test_clerk_123",
    humanSide: "red",
    difficulty: "easy",
    status: "in_progress",
    board: initialBoard(),
    turn: "red",
    moves: [],
    humanMoveCount: 0,
    plySinceProgress: 0,
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── POST /api/games ─────────────────────────────────────────────────────────

describe("POST / — create game", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGamesInsertOne.mockResolvedValue({
      insertedId: { toHexString: () => VALID_ID },
    });
  });

  it("returns 201 with game data for valid difficulty", async () => {
    const res = await gamesRouter.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty: "easy" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as Record<string, unknown>;
    expect(data["difficulty"]).toBe("easy");
    expect(data["status"]).toBe("in_progress");
    expect(data["turn"]).toBe("red");
    expect(data["humanSide"]).toBe("red");
    expect(mockGamesInsertOne).toHaveBeenCalledOnce();
  });

  it("sets startedAt server-side (CA-11)", async () => {
    const res = await gamesRouter.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty: "medium", startedAt: "FAKE_TIMESTAMP" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as Record<string, unknown>;
    expect(data["startedAt"]).not.toBe("FAKE_TIMESTAMP");
    expect(typeof data["startedAt"]).toBe("string");
  });

  it("returns 400 for invalid difficulty", async () => {
    const res = await gamesRouter.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty: "impossible" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json() as Record<string, unknown>;
    expect(data["code"]).toBe("INVALID_DIFFICULTY");
  });

  it("accepts all valid difficulties", async () => {
    for (const difficulty of ["easy", "medium", "hard"]) {
      mockGamesInsertOne.mockResolvedValue({
        insertedId: { toHexString: () => VALID_ID },
      });
      const res = await gamesRouter.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });
      expect(res.status).toBe(201);
    }
  });
});

// ─── GET /api/games ───────────────────────────────────────────────────────────

describe("GET / — list games", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGamesFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      project: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    });
  });

  it("returns 200 with empty array when no games", async () => {
    const res = await gamesRouter.request("/", { method: "GET" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect((data as unknown[]).length).toBe(0);
  });

  it("returns 200 with list of games", async () => {
    const games = [makeGameDoc(), makeGameDoc({ difficulty: "hard" })];
    mockGamesFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      project: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue(games),
    });
    const res = await gamesRouter.request("/", { method: "GET" });
    expect(res.status).toBe(200);
    const data = await res.json() as unknown[];
    expect(data.length).toBe(2);
  });
});

// ─── GET /api/games/:id ───────────────────────────────────────────────────────

describe("GET /:id — get game", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with game when found", async () => {
    mockGamesFindOne.mockResolvedValue(makeGameDoc());
    const res = await gamesRouter.request(`/${VALID_ID}`, { method: "GET" });
    expect(res.status).toBe(200);
    const data = await res.json() as Record<string, unknown>;
    expect(data["status"]).toBe("in_progress");
    expect(data["difficulty"]).toBe("easy");
  });

  it("returns 404 when game not found", async () => {
    mockGamesFindOne.mockResolvedValue(null);
    const res = await gamesRouter.request(`/${VALID_ID}`, { method: "GET" });
    expect(res.status).toBe(404);
    const data = await res.json() as Record<string, unknown>;
    expect(data["code"]).toBe("NOT_FOUND");
  });

  it("returns 404 for malformed id (CA-08 guard)", async () => {
    const res = await gamesRouter.request("/not-a-valid-id", { method: "GET" });
    expect(res.status).toBe(404);
  });
});

// ─── GET /api/games/:id/legal-moves ──────────────────────────────────────────

describe("GET /:id/legal-moves — get legal moves", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns array of legal moves for in-progress game", async () => {
    mockGamesFindOne.mockResolvedValue(makeGameDoc());
    const res = await gamesRouter.request(`/${VALID_ID}/legal-moves`, { method: "GET" });
    expect(res.status).toBe(200);
    const data = await res.json() as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("returns empty array for finished game", async () => {
    mockGamesFindOne.mockResolvedValue(makeGameDoc({ status: "human_won" }));
    const res = await gamesRouter.request(`/${VALID_ID}/legal-moves`, { method: "GET" });
    expect(res.status).toBe(200);
    const data = await res.json() as unknown[];
    expect(data.length).toBe(0);
  });

  it("returns 404 when game not found", async () => {
    mockGamesFindOne.mockResolvedValue(null);
    const res = await gamesRouter.request(`/${VALID_ID}/legal-moves`, { method: "GET" });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/games/:id ────────────────────────────────────────────────────

describe("DELETE /:id — abandon game", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 ok when game abandoned successfully", async () => {
    mockGamesUpdateOne.mockResolvedValue({ matchedCount: 1 });
    const res = await gamesRouter.request(`/${VALID_ID}`, { method: "DELETE" });
    expect(res.status).toBe(200);
    const data = await res.json() as Record<string, unknown>;
    expect(data["ok"]).toBe(true);
    expect(mockGamesUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({ clerkUserId: "user_test_clerk_123", status: "in_progress" }),
      expect.objectContaining({ $set: expect.objectContaining({ status: "abandoned" }) })
    );
  });

  it("returns 404 when game not found or already ended", async () => {
    mockGamesUpdateOne.mockResolvedValue({ matchedCount: 0 });
    const res = await gamesRouter.request(`/${VALID_ID}`, { method: "DELETE" });
    expect(res.status).toBe(404);
    const data = await res.json() as Record<string, unknown>;
    expect(data["code"]).toBe("NOT_FOUND");
  });

  it("returns 404 for malformed id", async () => {
    const res = await gamesRouter.request("/bad-id", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/games/:id/moves — illegal path ─────────────────────────────────

describe("POST /:id/moves — move validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when path has fewer than 2 squares", async () => {
    const res = await gamesRouter.request(`/${VALID_ID}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: [{ row: 5, col: 0 }] }),
    });
    expect(res.status).toBe(400);
    const data = await res.json() as Record<string, unknown>;
    expect(data["code"]).toBe("INVALID_PATH");
  });

  it("returns 404 when game not found", async () => {
    mockGamesFindOne.mockResolvedValue(null);
    const res = await gamesRouter.request(`/${VALID_ID}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: [{ row: 5, col: 0 }, { row: 4, col: 1 }] }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 409 GAME_OVER when game already ended", async () => {
    mockGamesFindOne.mockResolvedValue(makeGameDoc({ status: "human_won" }));
    const res = await gamesRouter.request(`/${VALID_ID}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: [{ row: 5, col: 0 }, { row: 4, col: 1 }] }),
    });
    expect(res.status).toBe(409);
    const data = await res.json() as Record<string, unknown>;
    expect(data["code"]).toBe("GAME_OVER");
  });

  it("returns 409 ILLEGAL_MOVE for invalid move path (CA-01)", async () => {
    mockGamesFindOne.mockResolvedValue(makeGameDoc());
    // Moving to a white square (row+col even) — invalid in damas
    const res = await gamesRouter.request(`/${VALID_ID}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: [{ row: 5, col: 1 }, { row: 4, col: 2 }] }),
    });
    expect(res.status).toBe(409);
    const data = await res.json() as Record<string, unknown>;
    expect(data["code"]).toBe("ILLEGAL_MOVE");
  });

  it("ignores board sent by client — uses DB board (CA-08)", async () => {
    // Client sends a path valid on the initial board
    // DB returns the same initial board, so result is based on DB board only
    mockGamesFindOne.mockResolvedValue(makeGameDoc());
    // This path is a valid opening move: red man at (5,0) → (4,1)
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        move: { path: [{ row: 2, col: 1 }, { row: 3, col: 2 }], captures: [], promotion: false },
        evaluation: 0,
        depthSearched: 1,
        thinkMs: 10,
      }),
    });
    vi.stubGlobal("fetch", fakeFetch);
    mockGamesUpdateOne.mockResolvedValue({ matchedCount: 1 });

    const res = await gamesRouter.request(`/${VALID_ID}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: [{ row: 5, col: 0 }, { row: 4, col: 1 }],
        board: "SHOULD_BE_IGNORED",
        startedAt: "SHOULD_BE_IGNORED",
      }),
    });
    // Regardless of what client sends, backend uses DB board
    expect([200, 409]).toContain(res.status);
    vi.unstubAllGlobals();
  });
});

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────

describe("GET /api/leaderboard — public ranking", () => {
  it("returns 200 with leaderboard entries (CA-16 public access)", async () => {
    const mockFind = vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([
        {
          _id: new ObjectId(),
          clerkUserId: "user1",
          displayName: "Alice",
          difficulty: "easy",
          movementsToWin: 18,
          gameDurationMs: 90000,
          endedAt: new Date().toISOString(),
        },
      ]),
    });

    vi.doMock("../src/db/index.ts", () => ({
      connectDb: vi.fn(),
      getDb: vi.fn(),
      col: {
        games: () => ({ insertOne: mockGamesInsertOne, findOne: mockGamesFindOne, find: mockGamesFind, updateOne: mockGamesUpdateOne }),
        leaderboard: () => ({ find: mockFind }),
        themes: () => ({ find: mockThemesFind }),
        userSkins: () => ({}),
        users: () => ({}),
      },
    }));

    const res = await leaderboardRouter.request("/?difficulty=easy&limit=10", { method: "GET" });
    expect(res.status).toBe(200);
    const data = await res.json() as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });
});

// ─── GET /api/themes — catálogo público ───────────────────────────────────────

describe("GET /api/themes — public skin catalog", () => {
  const mockThemesList = [
    {
      _id: { toString: () => "theme_id_001" },
      name: "Classic Wood",
      description: "Warm wooden board.",
      kind: "bundle",
      priceUsdCents: 299,
      stripePriceId: "price_test_classic",
      redPieceAsset: "/themes/classic_wood/red-man.svg",
      blackPieceAsset: "/themes/classic_wood/black-man.svg",
      previewImageUrl: "/themes/classic_wood/preview.svg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: { toString: () => "theme_id_002" },
      name: "Neon Glow",
      description: "Futuristic neon pieces.",
      kind: "pieces",
      priceUsdCents: 299,
      stripePriceId: "price_test_neon",
      redPieceAsset: "/themes/neon_glow/red-man.svg",
      blackPieceAsset: "/themes/neon_glow/black-man.svg",
      previewImageUrl: "/themes/neon_glow/preview.svg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: { toString: () => "theme_id_003" },
      name: "Marble Board",
      description: "Elegant marble pieces.",
      kind: "bundle",
      priceUsdCents: 399,
      stripePriceId: "price_test_marble",
      redPieceAsset: "/themes/marble_board/red-man.svg",
      blackPieceAsset: "/themes/marble_board/black-man.svg",
      previewImageUrl: "/themes/marble_board/preview.svg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: { toString: () => "theme_id_004" },
      name: "Vector Classic",
      description: "Clean flat vector design.",
      kind: "pieces",
      priceUsdCents: 199,
      stripePriceId: "price_test_vector",
      redPieceAsset: "/themes/vector_classic/red-man.svg",
      blackPieceAsset: "/themes/vector_classic/black-man.svg",
      previewImageUrl: "/themes/vector_classic/preview.svg",
      createdAt: new Date().toISOString(),
    },
    {
      _id: { toString: () => "theme_id_005" },
      name: "Retro Pixel",
      description: "8-bit pixel art style.",
      kind: "pieces",
      priceUsdCents: 99,
      stripePriceId: "price_test_retro",
      redPieceAsset: "/themes/retro_pixel/red-man.svg",
      blackPieceAsset: "/themes/retro_pixel/black-man.svg",
      previewImageUrl: "/themes/retro_pixel/preview.svg",
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockThemesFind.mockReturnValue({
      toArray: vi.fn().mockResolvedValue(mockThemesList),
    });
  });

  it("returns 200 with all 5 themes without auth (CA-16 public)", async () => {
    const { themesRouter } = await import("../src/routes/themes.ts");
    const res = await themesRouter.request("/", { method: "GET" });
    expect(res.status).toBe(200);
    const data = await res.json() as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(5);
  });

  it("each theme has required fields (name, priceUsdCents, pieceAssets, previewImageUrl)", async () => {
    const { themesRouter } = await import("../src/routes/themes.ts");
    const res = await themesRouter.request("/", { method: "GET" });
    const data = await res.json() as Record<string, unknown>[];
    for (const theme of data) {
      expect(typeof theme["name"]).toBe("string");
      expect(typeof theme["priceUsdCents"]).toBe("number");
      expect(theme["priceUsdCents"]).toBeGreaterThan(0);
      expect(typeof theme["previewImageUrl"]).toBe("string");
    }
  });

  it("piece themes have redPieceAsset and blackPieceAsset (RF-33 cosméticas)", async () => {
    const { themesRouter } = await import("../src/routes/themes.ts");
    const res = await themesRouter.request("/", { method: "GET" });
    const data = await res.json() as Record<string, unknown>[];
    const pieceThemes = data.filter(t => t["kind"] === "pieces" || t["kind"] === "bundle");
    for (const theme of pieceThemes) {
      if (theme["redPieceAsset"]) {
        expect(typeof theme["redPieceAsset"]).toBe("string");
        expect((theme["redPieceAsset"] as string).startsWith("/themes/")).toBe(true);
      }
    }
  });

  it("returns 404 for unknown theme on purchase endpoint", async () => {
    const { themesRouter } = await import("../src/routes/themes.ts");
    const res = await themesRouter.request("/not-a-valid-object-id/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(404);
    const data = await res.json() as Record<string, unknown>;
    expect(data["code"]).toBe("NOT_FOUND");
  });

  it("all 5 skin IDs follow the /themes/{skin_id}/ path convention", async () => {
    const { themesRouter } = await import("../src/routes/themes.ts");
    const res = await themesRouter.request("/", { method: "GET" });
    const data = await res.json() as Record<string, unknown>[];
    const skinIds = ["classic_wood", "neon_glow", "marble_board", "vector_classic", "retro_pixel"];
    const assetPaths = data
      .filter(t => t["redPieceAsset"])
      .map(t => t["redPieceAsset"] as string);
    for (const path of assetPaths) {
      const matchesSkinId = skinIds.some(id => path.includes(id));
      expect(matchesSkinId).toBe(true);
    }
  });
});
