import type {
  Difficulty,
  Game,
  Move,
  MoveRecord,
  Square,
  LeaderboardEntry,
  Theme,
  UserSkin,
  User,
} from "@damas/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: "UNKNOWN", message: res.statusText }));
    const err = new ApiError(body.code ?? "UNKNOWN", body.message ?? res.statusText, res.status);
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function createGame(difficulty: Difficulty, token?: string): Promise<Game> {
  return fetchJson<Game>("/api/games", {
    method: "POST",
    body: JSON.stringify({ difficulty }),
  }, token);
}

export async function listGames(token?: string): Promise<Game[]> {
  return fetchJson<Game[]>("/api/games", {}, token);
}

export async function getGame(id: string, token?: string): Promise<Game> {
  return fetchJson<Game>(`/api/games/${id}`, {}, token);
}

export async function sendMove(
  gameId: string,
  path: Square[],
  token?: string
): Promise<{ game: Game; lastAiMove?: MoveRecord }> {
  return fetchJson<{ game: Game; lastAiMove?: MoveRecord }>(
    `/api/games/${gameId}/moves`,
    {
      method: "POST",
      body: JSON.stringify({ path }),
    },
    token
  );
}

export async function getLegalMoves(gameId: string, token?: string): Promise<Move[]> {
  return fetchJson<Move[]>(`/api/games/${gameId}/legal-moves`, {}, token);
}

export async function deleteGame(gameId: string, token?: string): Promise<void> {
  return fetchJson<void>(`/api/games/${gameId}`, { method: "DELETE" }, token);
}

export async function getLeaderboard(
  difficulty: Difficulty,
  limit = 20,
  token?: string
): Promise<LeaderboardEntry[]> {
  return fetchJson<LeaderboardEntry[]>(
    `/api/leaderboard?difficulty=${difficulty}&limit=${limit}`,
    {},
    token
  );
}

export async function getThemes(token?: string): Promise<Theme[]> {
  return fetchJson<Theme[]>("/api/themes", {}, token);
}

export async function purchaseTheme(
  themeId: string,
  token?: string
): Promise<{ checkoutUrl: string }> {
  return fetchJson<{ checkoutUrl: string }>(
    `/api/themes/${themeId}/purchase`,
    { method: "POST" },
    token
  );
}

export interface MeResponse {
  user: User;
  skins: UserSkin[];
  activeTheme?: Theme;
}

export async function getMe(token?: string): Promise<MeResponse> {
  return fetchJson<MeResponse>("/api/me", {}, token);
}

export async function setActiveTheme(themeId: string, token?: string): Promise<void> {
  return fetchJson<void>(
    "/api/me/active-theme",
    {
      method: "PUT",
      body: JSON.stringify({ themeId }),
    },
    token
  );
}
