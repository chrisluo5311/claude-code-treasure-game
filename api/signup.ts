import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, hashPassword, createSession, route } from './_lib';

export default route(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, underscore)' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const rows = await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username}, ${hashPassword(password)})
      RETURNING id`;
    const id = rows[0].id as number;
    const token = await createSession(id);
    return res.json({ token, user: { id, username } });
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw err;
  }
});
