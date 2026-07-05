export interface User {
  id: number;
  username: string;
}

export interface ScoreStats {
  gamesPlayed: number;
  totalScore: number;
  bestScore: number;
}

export interface ScoreEntry {
  score: number;
  treasureFound: number;
  createdAt: string;
}

const TOKEN_KEY = 'treasure_game_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function signUp(username: string, password: string) {
  return request<{ token: string; user: User }>('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function signIn(username: string, password: string) {
  return request<{ token: string; user: User }>('/api/signin', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function signOut() {
  return request<{ ok: boolean }>('/api/signout', { method: 'POST' });
}

export function fetchMe() {
  return request<{ user: User }>('/api/me');
}

export function saveScore(score: number, treasureFound: boolean) {
  return request<{ ok: boolean }>('/api/scores', {
    method: 'POST',
    body: JSON.stringify({ score, treasureFound }),
  });
}

export function fetchScores() {
  return request<{ stats: ScoreStats; recent: ScoreEntry[] }>('/api/scores');
}
