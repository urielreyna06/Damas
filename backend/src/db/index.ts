import { MongoClient, type Db, type Collection, type Document } from "mongodb";

let client: MongoClient | null = null;
let _db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (_db) return _db;
  const uri = process.env["MONGODB_URI"];
  if (!uri) throw new Error("MONGODB_URI env var is required");
  client = new MongoClient(uri);
  await client.connect();
  _db = client.db();
  await ensureIndexes(_db);
  return _db;
}

async function ensureIndexes(database: Db): Promise<void> {
  await database.collection("games").createIndexes([
    { key: { clerkUserId: 1, status: 1 } },
    { key: { clerkUserId: 1, updatedAt: -1 } },
  ]);
  await database
    .collection("userSkins")
    .createIndex({ clerkUserId: 1, themeId: 1 }, { unique: true });
  await database.collection("leaderboard").createIndex({
    difficulty: 1,
    movementsToWin: 1,
    gameDurationMs: 1,
    endedAt: 1,
  });
}

export function getDb(): Db {
  if (!_db) throw new Error("DB not connected — call connectDb() first");
  return _db;
}

// Use Document as the generic so MongoDB's internal _id field doesn't conflict
// with our shared types' string _id. We cast as needed at the call site.
export const col = {
  games: (): Collection<Document> => getDb().collection("games"),
  users: (): Collection<Document> => getDb().collection("users"),
  themes: (): Collection<Document> => getDb().collection("themes"),
  userSkins: (): Collection<Document> => getDb().collection("userSkins"),
  leaderboard: (): Collection<Document> => getDb().collection("leaderboard"),
};
