import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const sql = neon(process.env.DATABASE_URL!);

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower ON users (lower(username))`;
      await sql`
        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS scores (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          score INTEGER NOT NULL,
          treasure_found INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), candidate);
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString('hex');
  await sql`INSERT INTO sessions (token, user_id) VALUES (${token}, ${userId})`;
  return token;
}

export interface AuthUser {
  id: number;
  username: string;
}

export async function getAuthUser(
  req: VercelRequest
): Promise<{ user: AuthUser; token: string } | null> {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!token) return null;
  const rows = await sql`
    SELECT users.id, users.username FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ${token}`;
  if (rows.length === 0) return null;
  return { user: rows[0] as AuthUser, token };
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;

// Wraps a route: bootstraps the schema and converts thrown errors to a 500 JSON body
export function route(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await ensureSchema();
      return await handler(req, res);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}
